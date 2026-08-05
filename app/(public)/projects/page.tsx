import Link from "next/link";
import { GitBranch } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PROJECT_STATUS_LABELS } from "@/features/projects/constants";
import { HubTemplate } from "@/components/templates/hub-template";
import { EntityCard } from "@/components/molecules/entity-card";
import { EmptyState } from "@/components/atoms/empty-state";
import { ProgressBar } from "@/components/atoms/progress-bar";
import { FilterPills } from "@/components/molecules/filter-pills";
import { SuggestionsRail } from "@/components/organisms/suggestions-rail";

export const metadata = { title: "Projets" };

// La base peut être injoignable au build (prod) → rendu dynamique.
export const dynamic = "force-dynamic";

/** Hub des projets OSS — chacun avec sa roadmap synchronisée depuis GitHub. */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();

  const [projects, statusCounts] = await Promise.all([
    db.project.findMany({
      where: status ? { status: status as ProjectStatus } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        problem: { select: { title: true, slug: true } },
        tasks: { select: { state: true, isGoodFirst: true } },
      },
    }),
    db.project.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  return (
    <HubTemplate
      title="Projets"
      description="Des projets concrets à construire ensemble. Chaque projet affiche sa roadmap vivante (issues GitHub) : ce qui est fait, ce qui est prêt à être pris, et qui s'en occupe."
      rail={<SuggestionsRail />}
      action={
        session?.user ? (
          <Link href="/projects/new" className={buttonVariants({ size: "sm" })}>
            Référencer un projet
          </Link>
        ) : undefined
      }
    >
      {statusCounts.length > 0 && (
        <div className="mb-6">
          <FilterPills
            baseHref="/projects"
            paramName="status"
            active={status}
            options={statusCounts.map((s) => ({
              label: PROJECT_STATUS_LABELS[s.status],
              value: s.status,
              count: s._count.status,
            }))}
          />
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState>
          {status
            ? "Aucun projet dans cet état pour l'instant."
            : "Aucun projet pour le moment. Référencez le premier !"}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const done = project.tasks.filter((t) => t.state === "CLOSED").length;
            const total = project.tasks.length;
            const goodFirst = project.tasks.filter(
              (t) => t.isGoodFirst && t.state === "OPEN",
            ).length;
            return (
              <EntityCard
                key={project.id}
                href={`/projects/${project.slug}`}
                icon={GitBranch}
                eyebrow={project.githubRepo}
                badge={PROJECT_STATUS_LABELS[project.status]}
                title={project.name}
                description={
                  project.problem
                    ? `Résout : ${project.problem.title}`
                    : project.description
                }
                meta={
                  <div className="flex w-full flex-col gap-2">
                    <ProgressBar value={done} max={total} label="Tâches faites" />
                    {goodFirst > 0 && (
                      <span className="text-xs text-accent">
                        {goodFirst} tâche{goodFirst > 1 ? "s" : ""} pour débuter
                      </span>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </HubTemplate>
  );
}
