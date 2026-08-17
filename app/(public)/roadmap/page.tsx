import { db } from "@/lib/db";

const STATUS = { PLANNED: "Planifié", IN_PROGRESS: "En cours", SHIPPED: "Livré", CANCELLED: "Annulé" } as const;
export const metadata = { title: "Objectifs de développement" };

export default async function RoadmapPage() {
  const goals = await db.developmentGoal.findMany({ include: { feedback: { select: { author: { select: { username: true } } } } }, orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }] });
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">Objectifs de développement</h1><p className="mt-2 text-muted-foreground">Les besoins validés de la communauté deviennent ici des objectifs suivis publiquement.</p>
      <div className="mt-8 grid gap-4">{goals.map((goal) => <article key={goal.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-primary/15 px-2 py-1">{STATUS[goal.status]}</span><span className="rounded-full bg-muted px-2 py-1">Priorité {goal.priority}/5</span></div><h2 className="mt-3 text-lg font-semibold">{goal.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{goal.summary}</p><p className="mt-3 text-xs text-muted-foreground">Proposé initialement par {goal.feedback.author ? `@${goal.feedback.author.username}` : "un ancien membre"}</p></article>)}</div>
      {goals.length === 0 && <p className="mt-8 rounded-lg border border-dashed p-8 text-center text-muted-foreground">Les premiers objectifs validés apparaîtront ici.</p>}
    </div>
  );
}
