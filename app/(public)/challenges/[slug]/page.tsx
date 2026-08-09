import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, LockKeyhole, Trophy } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasRank } from "@/lib/permissions";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import { AnswerForm } from "@/features/challenges/answer-form";
import { unlockHintAction } from "@/features/challenges/actions";
import { CHALLENGE_DIFFICULTY_LABELS, CHALLENGE_STATUS_LABELS } from "@/features/challenges/constants";

export default async function ChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const challenge = await db.challenge.findUnique({ where: { slug }, include: { author: { select: { id: true, username: true, name: true } }, hints: { orderBy: { position: "asc" } }, solves: { orderBy: [{ score: "desc" }, { solvedAt: "asc" }], take: 10, include: { user: { select: { username: true, name: true } } } } } });
  if (!challenge) notFound();
  const staff = session?.user ? hasRank(session.user.role, "MODERATOR") : false;
  const author = session?.user?.id === challenge.authorId;
  if (!["PUBLISHED", "CLOSED", "ARCHIVED"].includes(challenge.status) && !staff && !author) notFound();
  const [solve, attempts, unlocks] = session?.user ? await Promise.all([
    db.challengeSolve.findUnique({ where: { challengeId_userId: { challengeId: challenge.id, userId: session.user.id } } }),
    db.challengeAttempt.count({ where: { challengeId: challenge.id, userId: session.user.id } }),
    db.challengeHintUnlock.findMany({ where: { challengeId: challenge.id, userId: session.user.id }, select: { hintId: true } }),
  ]) : [null, 0, []];
  const unlocked = new Set(unlocks.map((item) => item.hintId));
  const open = challenge.status === "PUBLISHED" && (!challenge.closeAt || challenge.closeAt > new Date());
  const canSeeSolution = Boolean(solve || staff || author || !open);

  return <div className="mx-auto w-full max-w-4xl px-4 py-12"><Link href="/challenges" className="text-sm text-muted-foreground hover:underline">← Tous les défis</Link><div className="mt-5 flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{CHALLENGE_DIFFICULTY_LABELS[challenge.difficulty]}</span><span className="rounded-full bg-muted px-3 py-1 text-xs">{CHALLENGE_STATUS_LABELS[challenge.status]}</span><span className="font-bold text-primary">{challenge.basePoints} points</span></div><h1 className="mt-3 text-4xl font-bold tracking-tight">{challenge.title}</h1><p className="mt-2 text-sm text-muted-foreground">Imaginée par {challenge.author.name ?? `@${challenge.author.username}`} · {challenge.solves.length} résolution(s)</p>{challenge.story && <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 text-lg italic">{challenge.story}</div>}<article className="mt-8 rounded-xl border border-border p-6"><Markdown>{challenge.instructions}</Markdown></article>
  {session?.user && open && !solve && <div className="mt-6"><AnswerForm id={challenge.id} /><p className="mt-2 text-xs text-muted-foreground">{attempts}/{challenge.maxAttempts} tentatives utilisées · 5 tentatives maximum par minute.</p></div>}
  {!session?.user && open && <p className="mt-6 rounded-lg border border-border p-4"><Link href="/login" className="font-semibold underline">Connectez-vous</Link> pour proposer une réponse.</p>}
  {solve && <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 p-5 text-green-900"><CheckCircle2 /><strong>Résolue ! Vous avez gagné {solve.score} points.</strong></div>}
  {challenge.hints.length > 0 && open && !solve && <section className="mt-10"><h2 className="flex items-center gap-2 text-xl font-semibold"><LockKeyhole className="size-5" /> Indices</h2><div className="mt-4 space-y-3">{challenge.hints.map((hint) => <div key={hint.id} className="rounded-lg border border-border p-4">{unlocked.has(hint.id) ? <><strong>Indice {hint.position}</strong><p className="mt-2 text-sm">{hint.content}</p></> : session?.user ? <form action={unlockHintAction}><input type="hidden" name="hintId" value={hint.id} /><input type="hidden" name="slug" value={challenge.slug} /><Button type="submit" size="sm" variant="outline">Débloquer l’indice {hint.position} (−{hint.penalty} pts)</Button></form> : <p className="text-sm text-muted-foreground">Indice {hint.position} verrouillé</p>}</div>)}</div></section>}
  {canSeeSolution && <section className="mt-10 rounded-xl border border-border bg-muted/30 p-6"><h2 className="text-xl font-semibold">Explication de la solution</h2><div className="mt-4"><Markdown>{challenge.solutionExplanation}</Markdown></div></section>}
  {challenge.solves.length > 0 && <section className="mt-10"><h2 className="flex items-center gap-2 text-xl font-semibold"><Trophy className="size-5 text-primary" /> Classement du défi</h2><ol className="mt-4 divide-y divide-border rounded-xl border border-border">{challenge.solves.map((entry, index) => <li key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm"><span><strong className="mr-3 text-primary">#{index + 1}</strong>{entry.user.name ?? `@${entry.user.username}`}</span><span>{entry.score} pts · {entry.attemptsUsed} tentative(s)</span></li>)}</ol></section>}
  </div>;
}
