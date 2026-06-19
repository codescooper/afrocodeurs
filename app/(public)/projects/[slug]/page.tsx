import Link from "next/link";
import { notFound } from "next/navigation";
import { GitBranch, ExternalLink, Sparkles, ArrowRight, Rocket } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasRank } from "@/lib/permissions";
import { Markdown } from "@/components/shared/markdown";
import {
  getProjectRoadmap,
  getProjectTasks,
  getProjectDependencies,
} from "@/features/projects/queries";
import {
  DERIVED_STATUS_META,
  PROJECT_STATUS_LABELS,
} from "@/features/projects/constants";
import { DependencyForm } from "@/features/projects/dependency-form";
import { RefreshButton } from "@/features/projects/refresh-button";
import { removeDependencyAction } from "@/features/projects/actions";
import { Button, buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/** Anneau de progression (% de tâches terminées). */
function ProgressRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 72 72" className="size-20 -rotate-90">
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="6"
          stroke="currentColor"
          className="text-muted"
        />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="text-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
        {pct}%
      </span>
    </div>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      problem: { select: { title: true, slug: true } },
      community: { select: { name: true, slug: true } },
      createdBy: { select: { username: true, name: true } },
    },
  });
  if (!project) notFound();

  await db.project.update({
    where: { id: project.id },
    data: { views: { increment: 1 } },
  });

  const phases = await getProjectRoadmap(project.id);
  const isMaintainer = session?.user
    ? project.createdById === session.user.id ||
      hasRank(session.user.role, "MODERATOR")
    : false;

  const [allTasks, dependencies] = isMaintainer
    ? await Promise.all([
        getProjectTasks(project.id),
        getProjectDependencies(project.id),
      ])
    : [[], []];

  const repoUrl = `https://github.com/${project.githubRepo}`;

  // Statistiques de roadmap.
  const tasks = phases.flatMap((p) => p.tasks);
  const total = tasks.length;
  const done = tasks.filter((t) => t.derived === "DONE").length;
  const claimed = tasks.filter((t) => t.derived === "CLAIMED").length;
  const blocked = tasks.filter((t) => t.derived === "BLOCKED").length;
  const readyTasks = tasks
    .filter((t) => t.derived === "READY")
    .sort((a, b) => Number(b.isGoodFirst) - Number(a.isGoodFirst));
  const pct = total ? Math.round((done / total) * 100) : 0;
  const phasesWithTasks = phases.filter((p) => p.tasks.length > 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Référencé par{" "}
            <Link
              href={`/u/${project.createdBy.username}`}
              className="underline-offset-4 hover:underline"
            >
              {project.createdBy.name ?? project.createdBy.username}
            </Link>
            {project.lastSyncedAt && (
              <> · synchronisé le {project.lastSyncedAt.toLocaleDateString("fr")}</>
            )}
          </p>
        </div>
        {isMaintainer && (
          <RefreshButton projectId={project.id} slug={project.slug} />
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 hover:bg-muted"
        >
          <GitBranch className="size-4" />
          {project.githubRepo}
        </a>
        {project.websiteUrl && (
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            Site
          </a>
        )}
        {project.problem && (
          <Link
            href={`/explorer/${project.problem.slug}`}
            className="inline-flex items-center rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            Résout : {project.problem.title}
          </Link>
        )}
        {project.community && (
          <Link
            href={`/communities/${project.community.slug}`}
            className="inline-flex items-center rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            Équipe : {project.community.name}
          </Link>
        )}
      </div>

      <div className="mt-6">
        <Markdown>{project.description}</Markdown>
      </div>

      {/* ====================== ROADMAP ====================== */}
      <section className="mt-12">
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-3xl">🌱</p>
            <p className="mt-2 font-semibold">La roadmap se construit</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Les étapes apparaîtront dès que des issues seront ouvertes sur
              GitHub.
              {isMaintainer && " Utilise « Rafraîchir depuis GitHub »."}
            </p>
            <a
              href={`${repoUrl}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-5 ${buttonVariants({ size: "sm" })}`}
            >
              Ouvrir une issue sur GitHub
            </a>
          </div>
        ) : (
          <>
            {/* Vue d'ensemble : anneau + barre segmentée + chiffres */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-muted/50 to-background p-6">
              <div className="flex flex-wrap items-center gap-6">
                <ProgressRing pct={pct} />
                <div className="min-w-[14rem] flex-1">
                  <h2 className="text-lg font-bold">Roadmap du projet 🛠️</h2>
                  <p className="text-sm text-muted-foreground">
                    {done} étape{done > 1 ? "s" : ""} sur {total} déjà
                    franchie{done > 1 ? "s" : ""} — encore {total - done} à
                    construire ensemble.
                  </p>

                  {/* Barre segmentée : chaque tâche = un segment coloré */}
                  <div className="mt-3 flex gap-1" aria-hidden>
                    {tasks.map((t) => (
                      <span
                        key={t.id}
                        title={`#${t.githubNumber} · ${DERIVED_STATUS_META[t.derived].label}`}
                        className={`h-2.5 flex-1 rounded-full ${DERIVED_STATUS_META[t.derived].dot}`}
                      />
                    ))}
                  </div>

                  {/* Compteurs par statut */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-700">
                      ✅ {done} faites
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 font-medium text-amber-700">
                      🟢 {readyTasks.length} à prendre
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 font-medium text-sky-700">
                      👤 {claimed} en cours
                    </span>
                    {blocked > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                        🔒 {blocked} en attente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* À toi de jouer : tâches prêtes (bonnes premières en tête) */}
            {readyTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Sparkles className="size-4 text-primary" />
                  À toi de jouer
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ces tâches sont prêtes et libres. Prends-en une sur GitHub pour
                  rejoindre le chantier. 🙌
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {readyTasks.slice(0, 4).map((task) => (
                    <a
                      key={task.id}
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-xl border border-amber-400/40 bg-amber-400/5 p-4 transition-colors hover:border-amber-400 hover:bg-amber-400/10"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {task.isGoodFirst && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                            ⭐ bonne 1ʳᵉ tâche
                          </span>
                        )}
                        {task.independent && (
                          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                            indépendante
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 font-medium">
                        #{task.githubNumber} {task.title}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                        Prendre cette tâche
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Parcours : phases en timeline verticale */}
            <div className="mt-10">
              <h3 className="text-base font-bold">Le parcours</h3>
              <div className="mt-4 flex flex-col">
                {phasesWithTasks.map((phase, idx) => {
                  const pDone = phase.tasks.filter(
                    (t) => t.derived === "DONE",
                  ).length;
                  const pTotal = phase.tasks.length;
                  const complete = pDone === pTotal;
                  const last = idx === phasesWithTasks.length - 1;
                  return (
                    <div key={phase.id} className="relative pl-11">
                      {/* Trait vertical reliant les étapes */}
                      {!last && (
                        <span className="absolute bottom-0 left-[17px] top-2 w-0.5 bg-border" />
                      )}
                      {/* Nœud de phase */}
                      <span
                        className={`absolute left-0 top-0 flex size-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          complete
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-primary bg-background text-primary"
                        }`}
                      >
                        {complete ? "✓" : idx + 1}
                      </span>

                      <div className="pb-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{phase.title}</h4>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            {pDone}/{pTotal}
                          </span>
                        </div>

                        <ul className="mt-3 flex flex-col gap-2">
                          {phase.tasks.map((task) => {
                            const meta = DERIVED_STATUS_META[task.derived];
                            const isDone = task.derived === "DONE";
                            return (
                              <li
                                key={task.id}
                                className="rounded-lg border border-border bg-background p-3"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    title={meta.label}
                                    className={`size-2.5 shrink-0 rounded-full ${meta.dot}`}
                                  />
                                  <a
                                    href={task.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm font-medium underline-offset-4 hover:underline ${
                                      isDone
                                        ? "text-muted-foreground line-through"
                                        : ""
                                    }`}
                                  >
                                    #{task.githubNumber} {task.title}
                                  </a>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}
                                  >
                                    {meta.label}
                                  </span>
                                  {task.isGoodFirst && !isDone && (
                                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
                                      ⭐ bonne 1ʳᵉ tâche
                                    </span>
                                  )}
                                </div>
                                {(task.assignees.length > 0 ||
                                  task.prerequisites.length > 0) && (
                                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 pl-[1.125rem] text-xs text-muted-foreground">
                                    {task.assignees.length > 0 && (
                                      <span>
                                        👤{" "}
                                        {task.assignees
                                          .map((a) => `@${a}`)
                                          .join(", ")}
                                      </span>
                                    )}
                                    {task.prerequisites.length > 0 && (
                                      <span>
                                        🔒 Attend :{" "}
                                        {task.prerequisites
                                          .map((p) => `#${p.githubNumber}`)
                                          .join(", ")}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Appel à contribuer */}
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 p-6 text-center">
              <Rocket className="size-6 text-primary" />
              <div>
                <p className="font-semibold">Envie de faire avancer le projet ?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les tâches viennent des issues GitHub. Ouvre-en une et
                  assigne-toi — un compte GitHub gratuit suffit.
                </p>
              </div>
              <a
                href={`${repoUrl}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm" })}
              >
                Contribuer sur GitHub
              </a>
            </div>
          </>
        )}
      </section>

      {/* Contrôles mainteneur : graphe de dépendances */}
      {isMaintainer && allTasks.length >= 2 && (
        <section className="mt-10 rounded-lg border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold">
            Dépendances (réservé aux mainteneurs)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Déclare les prérequis entre tâches pour dessiner le graphe. Les
            cycles sont refusés automatiquement.
          </p>
          <div className="mt-3">
            <DependencyForm
              projectId={project.id}
              slug={project.slug}
              tasks={allTasks}
            />
          </div>
          {dependencies.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1.5 text-sm">
              {dependencies.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    #{d.task.githubNumber} dépend de #{d.dependsOn.githubNumber}
                  </span>
                  <form action={removeDependencyAction}>
                    <input type="hidden" name="dependencyId" value={d.id} />
                    <input type="hidden" name="slug" value={project.slug} />
                    <Button type="submit" size="sm" variant="ghost">
                      Retirer
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
