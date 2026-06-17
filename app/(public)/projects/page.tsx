import Link from "next/link";
import { GitBranch, ListChecks } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PROJECT_STATUS_LABELS } from "@/features/projects/constants";

export const metadata = { title: "Projets" };

// La base peut être injoignable au build (prod) → rendu dynamique.
export const dynamic = "force-dynamic";

/** Hub des projets OSS — chacun avec sa roadmap synchronisée depuis GitHub. */
export default async function ProjectsPage() {
  const session = await auth();
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      problem: { select: { title: true, slug: true } },
      tasks: { select: { state: true, isGoodFirst: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Des projets concrets à construire ensemble. Chaque projet affiche sa
            roadmap vivante (issues GitHub) : ce qui est fait, ce qui est prêt à
            être pris, et qui s&apos;en occupe.
          </p>
        </div>
        {session?.user && (
          <Link href="/projects/new" className={buttonVariants({ size: "sm" })}>
            Référencer un projet
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun projet pour le moment. Référencez le premier !
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const open = project.tasks.filter((t) => t.state === "OPEN").length;
            const goodFirst = project.tasks.filter(
              (t) => t.isGoodFirst && t.state === "OPEN",
            ).length;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <GitBranch className="size-3.5" />
                    {project.githubRepo}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
                <h2 className="font-semibold">{project.name}</h2>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {project.description}
                </p>
                {project.problem && (
                  <p className="text-xs text-muted-foreground">
                    Résout : {project.problem.title}
                  </p>
                )}
                <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ListChecks className="size-3.5" />
                  {open} tâche{open > 1 ? "s" : ""} ouverte
                  {open > 1 ? "s" : ""}
                  {goodFirst > 0 && ` · ${goodFirst} pour débuter`}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
