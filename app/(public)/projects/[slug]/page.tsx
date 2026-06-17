import Link from "next/link";
import { notFound } from "next/navigation";
import { GitBranch, ExternalLink } from "lucide-react";

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
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

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
  const hasTasks = phases.some((p) => p.tasks.length > 0);

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

      {/* Roadmap */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Roadmap</h2>
          <a
            href={`${repoUrl}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
          >
            Contribuer sur GitHub <ExternalLink className="size-3.5" />
          </a>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Les tâches viennent des issues GitHub. Pour en prendre une, ouvre-la
          sur GitHub et assigne-toi (un compte GitHub gratuit suffit).
        </p>

        {!hasTasks ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucune tâche synchronisée pour l&apos;instant.
            {isMaintainer && " Utilise « Rafraîchir depuis GitHub »."}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-8">
            {phases
              .filter((p) => p.tasks.length > 0)
              .map((phase) => (
                <div key={phase.id}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {phase.title}
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2">
                    {phase.tasks.map((task) => {
                      const meta = DERIVED_STATUS_META[task.derived];
                      return (
                        <li
                          key={task.id}
                          className="rounded-lg border border-border bg-background p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span title={meta.label}>{meta.icon}</span>
                            <a
                              href={task.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium underline-offset-4 hover:underline"
                            >
                              #{task.githubNumber} {task.title}
                            </a>
                            {task.isGoodFirst && (
                              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] text-accent">
                                bonne 1ʳᵉ tâche
                              </span>
                            )}
                            {task.independent && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                indépendante
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {meta.icon} {meta.label}
                            </span>
                            {task.assignees.length > 0 && (
                              <span>
                                👤{" "}
                                {task.assignees.map((a) => `@${a}`).join(", ")}
                              </span>
                            )}
                            {task.prerequisites.length > 0 && (
                              <span>
                                🔒 Prérequis :{" "}
                                {task.prerequisites
                                  .map((p) => `#${p.githubNumber}`)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
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
