import Link from "next/link";
import { Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getLeaderboard } from "@/features/reputation/queries";

type Item = { label: string; href: string; meta?: string };

export default async function HomePage() {
  const [problems, knowledge, communities, makers, counts] = await Promise.all([
    db.problem.findMany({
      select: { title: true, slug: true, sector: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.knowledge.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    db.community.findMany({
      select: { name: true, slug: true, _count: { select: { members: true } } },
      orderBy: { members: { _count: "desc" } },
      take: 5,
    }),
    getLeaderboard(5),
    Promise.all([db.problem.count(), db.solution.count(), db.user.count()]),
  ]);
  const [problemCount, solutionCount, userCount] = counts;

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Des problèmes aux solutions,{" "}
          <span className="text-primary">ensemble.</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          La communauté panafricaine où les passionnés de technologie
          apprennent, collaborent et construisent des solutions adaptées aux
          réalités du continent.
        </p>

        <form
          action="/search"
          className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-sm"
        >
          <Search className="ml-2 size-5 text-muted-foreground" />
          <input
            name="q"
            placeholder="Quel problème souhaitez-vous résoudre ?"
            className="flex-1 bg-transparent py-2 text-sm outline-none"
          />
          <button type="submit" className={buttonVariants({ size: "sm" })}>
            Rechercher
          </button>
        </form>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/explorer" className={buttonVariants({ size: "lg" })}>
            Explorer les problèmes
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Rejoindre la communauté
          </Link>
        </div>
      </section>

      {/* Découverte — alimentée en temps réel */}
      <div className="grid gap-6 pb-16 md:grid-cols-2">
        <DiscoveryCard
          title="Problèmes à résoudre"
          subtitle="Quel problème puis-je résoudre ?"
          href="/explorer"
          empty="Sois le premier à proposer un problème."
          items={problems.map((p) => ({
            label: p.title,
            href: `/explorer/${p.slug}`,
            meta: p.sector,
          }))}
        />
        <DiscoveryCard
          title="Savoir récent"
          subtitle="Qu'est-ce que je peux apprendre ?"
          href="/knowledge"
          empty="Aucune ressource publiée pour l'instant."
          items={knowledge.map((k) => ({
            label: k.title,
            href: `/knowledge/${k.slug}`,
          }))}
        />
        <DiscoveryCard
          title="Communautés actives"
          subtitle="Qui peut m'aider ?"
          href="/communities"
          empty="Aucune communauté pour l'instant."
          items={communities.map((c) => ({
            label: c.name,
            href: `/communities/${c.slug}`,
            meta: `${c._count.members} membre${c._count.members > 1 ? "s" : ""}`,
          }))}
        />
        <DiscoveryCard
          title="AfroMakers à suivre"
          subtitle="Build Before Consume"
          href="/afromakers"
          empty="Le classement se remplit avec les contributions."
          items={makers.map((m) => ({
            label: m.user.name ?? `@${m.user.username}`,
            href: `/u/${m.user.username}`,
            meta: `${m.points} pts`,
          }))}
        />
      </div>

      {/* Statistiques réelles */}
      <section className="mb-20 grid grid-cols-3 gap-4 rounded-lg border border-border bg-muted/40 p-6 text-center">
        <Stat label="Problèmes" value={problemCount} />
        <Stat label="Solutions" value={solutionCount} />
        <Stat label="Membres" value={userCount} />
      </section>
    </div>
  );
}

function DiscoveryCard({
  title,
  subtitle,
  href,
  items,
  empty,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: Item[];
  empty: string;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-background p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link
          href={href}
          className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Tout voir →
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-primary"
              >
                <span className="line-clamp-1">{it.label}</span>
                {it.meta && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {it.meta}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
