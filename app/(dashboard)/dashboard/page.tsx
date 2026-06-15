import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getReputation } from "@/features/reputation/queries";
import { VerifyEmailBanner } from "@/features/auth/verify-email-banner";

export const metadata = { title: "Tableau de bord" };

type FeedItem = {
  kind: "Problème" | "Ressource";
  title: string;
  href: string;
  meta?: string;
  date: Date;
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;

  const [
    rep,
    account,
    myQuestions,
    myCommunities,
    recentProblems,
    recentKnowledge,
  ] = await Promise.all([
    getReputation(user.id),
    db.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    }),
    db.question.findMany({
      where: { authorId: user.id },
      select: { title: true, slug: true, _count: { select: { answers: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.communityMember.findMany({
      where: { userId: user.id },
      select: { community: { select: { name: true, slug: true } } },
      take: 8,
    }),
    db.problem.findMany({
      select: { title: true, slug: true, sector: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.knowledge.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  const feed: FeedItem[] = [
    ...recentProblems.map((p) => ({
      kind: "Problème" as const,
      title: p.title,
      href: `/explorer/${p.slug}`,
      meta: p.sector,
      date: p.createdAt,
    })),
    ...recentKnowledge.map((k) => ({
      kind: "Ressource" as const,
      title: k.title,
      href: `/knowledge/${k.slug}`,
      date: k.publishedAt ?? new Date(0),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Bienvenue, {user.name ?? `@${user.username}`} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Niveau{" "}
            <span className="font-medium text-foreground">
              {rep.level.label}
            </span>{" "}
            · {rep.total} pts
            {rep.next
              ? ` · ${rep.next.min - rep.total} vers ${rep.next.label}`
              : ""}
          </p>
        </div>
        <Link
          href="/afromakers"
          className="text-sm font-medium text-foreground underline"
        >
          Classement AfroMakers →
        </Link>
      </div>

      {!account?.emailVerified && <VerifyEmailBanner />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quoi de neuf — flux de contenu frais */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-semibold">Quoi de neuf</h2>
          {feed.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Le contenu de la communauté apparaîtra ici.
            </p>
          ) : (
            feed.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/40"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {it.kind}
                </span>
                <p className="mt-1 line-clamp-2 font-medium">{it.title}</p>
                {it.meta && (
                  <p className="mt-1 text-xs text-muted-foreground">{it.meta}</p>
                )}
              </Link>
            ))
          )}
        </div>

        {/* Toi : questions + communautés */}
        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Tes questions</h2>
              <Link
                href="/forum"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forum →
              </Link>
            </div>
            {myQuestions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Pas encore de question.{" "}
                <Link href="/forum" className="underline">
                  Pose-en une
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {myQuestions.map((q) => (
                  <li key={q.slug}>
                    <Link
                      href={`/forum/${q.slug}`}
                      className="flex items-center justify-between gap-2 text-sm hover:text-primary"
                    >
                      <span className="line-clamp-1">{q.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {q._count.answers} rép.
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Tes communautés</h2>
              <Link
                href="/communities"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Toutes →
              </Link>
            </div>
            {myCommunities.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                <Link href="/communities" className="underline">
                  Rejoins une communauté
                </Link>{" "}
                pour rester connecté·e.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {myCommunities.map((m) => (
                  <li key={m.community.slug}>
                    <Link
                      href={`/communities/${m.community.slug}`}
                      className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-muted/60"
                    >
                      {m.community.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
