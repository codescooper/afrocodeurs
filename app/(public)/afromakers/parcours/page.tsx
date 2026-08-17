import Link from "next/link";
import { ArrowRight, Sparkles, Target, Trophy } from "lucide-react";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  REPUTATION_ACTION_LABELS,
  REPUTATION_LEVELS,
  REPUTATION_POINTS,
  UPVOTE_POINTS,
  type ReputationAction,
} from "@/features/reputation/constants";
import { getReputation } from "@/features/reputation/queries";

export const metadata = { title: "Parcours AfroMaker" };

const ACTION_LINKS: Partial<Record<ReputationAction, string>> = {
  QUESTION_ASKED: "/forum/new",
  ANSWER_POSTED: "/forum",
  KNOWLEDGE_PUBLISHED: "/knowledge/new",
  PROBLEM_PROPOSED: "/explorer/new",
  SOLUTION_ADDED: "/explorer",
  PROJECT_CREATED: "/projects/new",
  CHALLENGE_CREATED: "/challenges/new",
  CHALLENGE_SOLVED: "/challenges",
};

export default async function AfroMakerJourneyPage() {
  const session = await auth();
  const reputation = session?.user ? await getReputation(session.user.id) : null;
  const currentMin = reputation?.level.min ?? 0;
  const nextMin = reputation?.next?.min ?? currentMin;
  const progress = reputation?.next
    ? Math.max(0, Math.min(100, ((reputation.total - currentMin) / (nextMin - currentMin)) * 100))
    : 100;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary"><Sparkles className="size-5" /><span className="text-xs font-bold uppercase tracking-[.18em]">Build Before Consume</span></div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{reputation ? "Mon parcours AfroMaker" : "Le parcours AfroMaker"}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Chaque contribution utile fait progresser votre parcours. Les points sont attribués automatiquement lorsque l’action est réellement accomplie.</p>
        </div>
        <Link href="/afromakers" className={buttonVariants({ variant: "outline" })}>Voir le classement</Link>
      </div>

      {reputation ? (
        <section className="mt-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-amber-400/10 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm text-muted-foreground">Niveau actuel</p><p className="text-2xl font-bold">{reputation.level.label}</p><p className="mt-1 text-sm">{reputation.total} points · {reputation.participation} en participation · {reputation.contribution} en contribution</p></div>
            {reputation.next ? <p className="font-semibold text-primary">Encore {reputation.next.min - reputation.total} points pour devenir {reputation.next.label}</p> : <p className="font-semibold text-primary">Niveau maximal atteint</p>}
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted" aria-label={`${Math.round(progress)} % vers le prochain niveau`}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
        </section>
      ) : (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-6"><div><h2 className="font-bold">Envie de commencer votre parcours ?</h2><p className="text-sm text-muted-foreground">Créez votre compte pour suivre votre progression personnelle.</p></div><Link href="/register" className={buttonVariants()}>Créer mon compte</Link></section>
      )}

      <section className="mt-12">
        <div className="flex items-center gap-2"><Trophy className="size-5 text-primary" /><h2 className="text-2xl font-bold">Les niveaux</h2></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{REPUTATION_LEVELS.map((level) => <div key={level.label} className={`rounded-xl border p-4 ${reputation?.level.label === level.label ? "border-primary bg-primary/5" : "border-border"}`}><p className="font-bold">{level.label}</p><p className="text-sm text-muted-foreground">À partir de {level.min} points</p></div>)}</div>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-2"><Target className="size-5 text-primary" /><h2 className="text-2xl font-bold">Comment progresser</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">La participation fait vivre les échanges. La contribution crée des ressources durables pour toute la communauté.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">{(Object.entries(REPUTATION_POINTS) as Array<[ReputationAction, (typeof REPUTATION_POINTS)[ReputationAction]]>).map(([action, definition]) => { const href = ACTION_LINKS[action]; return <div key={action} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"><div><p className="font-medium">{REPUTATION_ACTION_LABELS[action]}</p><p className="text-xs text-muted-foreground">{definition.dimension === "PARTICIPATION" ? "Participation" : "Contribution"}</p></div><div className="flex items-center gap-3"><strong className="whitespace-nowrap text-primary">+{definition.points} pts</strong>{href && <Link href={href} aria-label={`Commencer : ${REPUTATION_ACTION_LABELS[action]}`} className="rounded-full p-1 hover:bg-muted"><ArrowRight className="size-4" /></Link>}</div></div>; })}</div>
        <p className="mt-4 rounded-lg bg-muted/50 p-4 text-sm"><strong>Contenu apprécié :</strong> chaque vote positif reçu rapporte {UPVOTE_POINTS} points à son auteur. Si le vote est retiré, ces points le sont également.</p>
      </section>
    </div>
  );
}
