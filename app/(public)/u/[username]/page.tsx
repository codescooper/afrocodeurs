import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Code2,
  ExternalLink,
  Globe,
  Briefcase,
  MapPin,
  MessageSquare,
} from "lucide-react";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getReputation } from "@/features/reputation/queries";
import { FollowButton } from "@/features/follow/follow-button";
import { USER_ROLE_LABELS } from "@/features/admin/constants";
import { KNOWLEDGE_TYPE_LABELS } from "@/features/knowledge/constants";
import { QUESTION_STATUS_LABELS } from "@/features/forum/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username}` };
}

/** Profil public AfroMaker (v1) : identité, compétences, liens, contributions. */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    include: {
      profile: true,
      knowledge: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, type: true },
      },
      questions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, status: true },
      },
      communities: {
        take: 6,
        orderBy: { joinedAt: "desc" },
        include: { community: { select: { name: true, slug: true } } },
      },
      _count: {
        select: {
          knowledge: { where: { status: "PUBLISHED" } },
          questions: true,
          answers: true,
          problems: true,
          solutions: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) notFound();

  const session = await auth();
  const isSelf = session?.user?.id === user.id;
  const isFollowing =
    session?.user?.id && !isSelf
      ? Boolean(
          await db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: session.user.id,
                followingId: user.id,
              },
            },
            select: { id: true },
          }),
        )
      : false;

  const rep = await getReputation(user.id);

  const p = user.profile;
  const location = [p?.city, p?.country].filter(Boolean).join(", ");
  const memberSince = user.createdAt.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const links = [
    { href: p?.githubUrl, label: "GitHub", icon: Code2 },
    { href: p?.linkedinUrl, label: "LinkedIn", icon: ExternalLink },
    { href: p?.websiteUrl, label: "Site web", icon: Globe },
    { href: p?.portfolioUrl, label: "Portfolio", icon: Briefcase },
  ].filter((l) => l.href);

  const stats = [
    ["Ressources", user._count.knowledge],
    ["Questions", user._count.questions],
    ["Réponses", user._count.answers],
    ["Problèmes", user._count.problems],
    ["Solutions", user._count.solutions],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      {/* En-tête */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {user.name ?? `@${user.username}`}
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {USER_ROLE_LABELS[user.role]}
          </span>
          {session?.user && !isSelf && (
            <span className="ml-auto">
              <FollowButton userId={user.id} initialFollowing={isFollowing} />
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        <div className="flex gap-4 text-sm">
          <span>
            <b className="text-foreground">{user._count.followers}</b>{" "}
            <span className="text-muted-foreground">abonné·e·s</span>
          </span>
          <span>
            <b className="text-foreground">{user._count.following}</b>{" "}
            <span className="text-muted-foreground">abonnements</span>
          </span>
        </div>

        {p?.bio && <p className="max-w-2xl text-muted-foreground">{p.bio}</p>}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            Membre depuis {memberSince}
          </span>
        </div>

        {links.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <a
                  key={l.label}
                  href={l.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <Icon className="size-4" />
                  {l.label}
                </a>
              );
            })}
          </div>
        )}
      </header>

      {/* Réputation */}
      <section className="mt-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 p-5">
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-primary">{rep.total}</span>
          <span className="text-xs text-muted-foreground">
            points de réputation
          </span>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-col">
          <span className="font-semibold">{rep.level.label}</span>
          {rep.next && (
            <span className="text-xs text-muted-foreground">
              {rep.next.min - rep.total} pts vers {rep.next.label}
            </span>
          )}
        </div>
        <div className="ml-auto flex gap-4 text-sm text-muted-foreground">
          <span>
            Contribution <b className="text-foreground">{rep.contribution}</b>
          </span>
          <span>
            Participation <b className="text-foreground">{rep.participation}</b>
          </span>
        </div>
      </section>

      {/* Langues & compétences */}
      {(p?.languages.length || p?.skills.length) ? (
        <section className="mt-8 flex flex-col gap-3">
          {p!.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {p!.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {p!.languages.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Langues : {p!.languages.join(", ")}
            </p>
          )}
        </section>
      ) : null}

      {/* Statistiques */}
      <section className="mt-8 grid grid-cols-5 gap-2 rounded-lg border border-border bg-muted/40 p-4 text-center">
        {stats.map(([label, value]) => (
          <div key={label}>
            <div className="text-xl font-bold text-primary">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </section>

      {/* Contributions */}
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="size-5 text-primary" />
            Ressources publiées
          </h2>
          {user.knowledge.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Aucune ressource publiée.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {user.knowledge.map((k) => (
                <li key={k.id}>
                  <Link
                    href={`/knowledge/${k.slug}`}
                    className="flex flex-col rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted/40"
                  >
                    <span className="font-medium">{k.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {KNOWLEDGE_TYPE_LABELS[k.type]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="size-5 text-primary" />
            Questions récentes
          </h2>
          {user.questions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Aucune question posée.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {user.questions.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/forum/${q.slug}`}
                    className="flex flex-col rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted/40"
                  >
                    <span className="font-medium">{q.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {QUESTION_STATUS_LABELS[q.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Communautés */}
      {user.communities.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Communautés</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.communities.map((m) => (
              <Link
                key={m.id}
                href={`/communities/${m.community.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:bg-muted/40"
              >
                {m.community.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
