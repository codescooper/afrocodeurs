import Link from "next/link";
import { BrainCircuit, CalendarDays, Trophy } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/atoms/empty-state";
import { HubTemplate } from "@/components/templates/hub-template";
import { CHALLENGE_DIFFICULTY_LABELS } from "@/features/challenges/constants";

export const metadata = { title: "Défis" };

export default async function ChallengesPage() {
  const session = await auth();
  const now = new Date();
  const [challenges, leaders] = await Promise.all([
    db.challenge.findMany({
      where: { status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] } },
      orderBy: [{ status: "asc" }, { publishedAt: "desc" }],
      include: { author: { select: { username: true, name: true } }, _count: { select: { solves: true } } },
    }),
    db.challengeSolve.groupBy({ by: ["userId"], _sum: { score: true }, _count: { _all: true }, orderBy: { _sum: { score: "desc" } }, take: 10 }),
  ]);
  const users = await db.user.findMany({ where: { id: { in: leaders.map((leader) => leader.userId) } }, select: { id: true, username: true, name: true } });
  const userMap = new Map(users.map((user) => [user.id, user]));
  const active = challenges.filter((challenge) => challenge.status === "PUBLISHED" && (!challenge.closeAt || challenge.closeAt > now));
  const archives = challenges.filter((challenge) => !active.some((item) => item.id === challenge.id));

  return <HubTemplate
    title="AfroCodeurs Défis"
    description="Une énigme tech ludique chaque semaine. Réfléchissez, débloquez des indices et grimpez au classement."
    action={can(session?.user?.role, "challenge:create") ? <Link href="/challenges/new" className={buttonVariants({ size: "sm" })}>Proposer une énigme</Link> : undefined}
    rail={<aside className="rounded-xl border border-border p-5"><h2 className="flex items-center gap-2 font-semibold"><Trophy className="size-5 text-primary" /> Classement</h2><ol className="mt-4 space-y-3">{leaders.map((leader, index) => { const user = userMap.get(leader.userId); return <li key={leader.userId} className="flex items-center justify-between text-sm"><span><strong className="mr-2 text-primary">#{index + 1}</strong>{user?.name ?? `@${user?.username ?? "membre"}`}</span><span className="font-semibold">{leader._sum.score ?? 0} pts</span></li>; })}</ol>{leaders.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Le classement attend ses premiers explorateurs.</p>}</aside>}
  >
    <section><h2 className="flex items-center gap-2 text-xl font-semibold"><CalendarDays className="size-5 text-primary" /> Cette semaine</h2>{active.length === 0 ? <div className="mt-4"><EmptyState>La prochaine énigme est en préparation.</EmptyState></div> : <div className="mt-4 grid gap-4 sm:grid-cols-2">{active.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} active />)}</div>}</section>
    {archives.length > 0 && <section className="mt-10"><h2 className="text-xl font-semibold">Archives</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{archives.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div></section>}
  </HubTemplate>;
}

function ChallengeCard({ challenge, active = false }: { challenge: { slug: string; title: string; story: string | null; difficulty: keyof typeof CHALLENGE_DIFFICULTY_LABELS; basePoints: number; author: { username: string; name: string | null }; _count: { solves: number } }; active?: boolean }) {
  return <Link href={`/challenges/${challenge.slug}`} className="group flex flex-col rounded-xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><BrainCircuit className="size-4" />{CHALLENGE_DIFFICULTY_LABELS[challenge.difficulty]}</span><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{challenge.basePoints} pts</span></div><h3 className="mt-3 text-lg font-semibold group-hover:underline">{challenge.title}</h3>{challenge.story && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{challenge.story}</p>}<p className="mt-4 text-xs text-muted-foreground">{active ? "Ouverte" : "Terminée"} · {challenge._count.solves} résolution(s) · par {challenge.author.name ?? `@${challenge.author.username}`}</p></Link>;
}
