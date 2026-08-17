import Link from "next/link";
import { CheckCheck, CircleDot, Lightbulb, Rocket, Trophy } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import { markPlatformUpdatesReadAction } from "@/features/updates/actions";

export const metadata = { title: "Nouveautés & feuille de route" };

const GOAL_STATUS = {
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  SHIPPED: "Livré",
  CANCELLED: "Annulé",
} as const;

const FEEDBACK_STATUS = {
  NEW: "À étudier",
  REVIEWING: "En analyse",
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
  CONVERTED: "Objectif créé",
} as const;

export default async function UpdatesPage() {
  const session = await auth();
  const updates = session?.user
    ? await db.platformUpdate.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      include: { reads: { where: { userId: session.user.id }, select: { id: true } } },
    })
    : (await db.platformUpdate.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    })).map((update) => ({ ...update, reads: [] as { id: string }[] }));

  const [goals, suggestions] = await Promise.all([
    db.developmentGoal.findMany({
      include: {
        feedback: {
          select: {
            submittedByLabel: true,
            sourceUrl: true,
            author: { select: { username: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
    db.productFeedback.findMany({
      where: { developmentGoal: null, status: { in: ["NEW", "REVIEWING", "ACCEPTED"] } },
      include: { author: { select: { username: true } } },
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    }),
  ]);
  const unread = Boolean(session?.user && updates.some((update) => update.reads.length === 0));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary"><Rocket className="size-5" /><span className="text-xs font-semibold uppercase tracking-[.2em]">Construite avec la communauté</span></div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Nouveautés & feuille de route</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">Le livre d’or des améliorations demandées par les membres, les objectifs validés et toutes les idées qui attendent encore une décision.</p>
        </div>
        {unread && <form action={markPlatformUpdatesReadAction}><Button type="submit" variant="outline"><CheckCheck /> Tout marquer comme consulté</Button></form>}
      </header>

      <nav className="mt-8 flex flex-wrap gap-2 text-sm">
        <a href="#livre-or" className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground">Livre d’or</a>
        <a href="#roadmap" className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted">Roadmap</a>
        <a href="#a-etudier" className="rounded-full border border-border px-4 py-2 font-medium hover:bg-muted">À étudier</a>
      </nav>

      <section id="livre-or" className="scroll-mt-24 pt-14">
        <div className="flex items-center gap-3"><Trophy className="size-6 text-primary" /><div><h2 className="text-2xl font-bold">Livre d’or des améliorations livrées</h2><p className="text-sm text-muted-foreground">Chaque évolution garde la trace des personnes qui l’ont proposée.</p></div></div>
        <div className="mt-6 space-y-6">
          {updates.map((update) => {
            const isUnread = Boolean(session?.user && update.reads.length === 0);
            return <article key={update.id} className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 sm:p-8">
              {isUnread && <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">Nouveau</span>}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><span>{update.category}</span><span aria-hidden>·</span><span>{update.version}</span><span aria-hidden>·</span><time>{(update.publishedAt ?? update.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time></div>
              <h3 className="mt-3 pr-16 text-2xl font-bold">{update.title}</h3>
              <p className="mt-2 text-muted-foreground">{update.summary}</p>
              {update.requestedBy && <p className="mt-4 rounded-lg bg-primary/10 px-4 py-3 text-sm"><strong>Demandé par :</strong> {update.requestedBy}{update.sourceUrl && <> · <Link href={update.sourceUrl} className="underline">Voir la demande</Link></>}</p>}
              <div className="mt-6 border-t border-border pt-6"><Markdown>{update.content}</Markdown></div>
            </article>;
          })}
          {updates.length === 0 && <Empty text="Le livre d’or sera bientôt disponible." />}
        </div>
      </section>

      <section id="roadmap" className="scroll-mt-24 pt-16">
        <div className="flex items-center gap-3"><CircleDot className="size-6 text-primary" /><div><h2 className="text-2xl font-bold">Feuille de route communautaire</h2><p className="text-sm text-muted-foreground">Les demandes validées deviennent des objectifs suivis publiquement.</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => <article key={goal.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary/15 px-2 py-1">{GOAL_STATUS[goal.status]}</span><span className="rounded-full bg-muted px-2 py-1">Priorité {goal.priority}/5</span></div><h3 className="mt-3 text-lg font-semibold">{goal.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{goal.summary}</p><Attribution label={goal.feedback.submittedByLabel} username={goal.feedback.author?.username} sourceUrl={goal.feedback.sourceUrl} /></article>)}
          {goals.length === 0 && <Empty text="Les premiers objectifs validés apparaîtront ici." />}
        </div>
      </section>

      <section id="a-etudier" className="scroll-mt-24 pt-16">
        <div className="flex items-center gap-3"><Lightbulb className="size-6 text-primary" /><div><h2 className="text-2xl font-bold">Demandes à étudier</h2><p className="text-sm text-muted-foreground">Inventaire public sans décision prise : la communauté peut suivre ce qui reste à analyser.</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {suggestions.map((item) => <article key={item.id} className="rounded-xl border border-border p-5"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-2 py-1">{FEEDBACK_STATUS[item.status]}</span><span className="rounded-full bg-primary/15 px-2 py-1">Priorité {item.priorityScore}/5</span></div><h3 className="mt-3 font-semibold">{item.title}</h3><p className="mt-2 text-sm text-muted-foreground">{item.description}</p><Attribution label={item.submittedByLabel} username={item.author?.username} sourceUrl={item.sourceUrl} /></article>)}
          {suggestions.length === 0 && <Empty text="Aucune demande en attente d’étude." />}
        </div>
      </section>
    </div>
  );
}

function Attribution({ label, username, sourceUrl }: { label?: string | null; username?: string | null; sourceUrl?: string | null }) {
  const author = label ?? (username ? `@${username}` : "la communauté");
  return <p className="mt-4 text-xs text-muted-foreground">Proposé par {author}{sourceUrl && <> · <Link href={sourceUrl} className="underline">Contexte</Link></>}</p>;
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</p>;
}
