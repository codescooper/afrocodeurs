import { publicContentMetadata } from "@/features/seo/metadata";
import Link from "next/link";
import { ContentShare } from "@/components/shared/content-share";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Eye,
  GitBranch,
  Globe,
  MapPin,
  Scale,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { SOLUTION_TYPE_LABELS } from "@/features/solutions/constants";
import { PROJECT_STATUS_LABELS } from "@/features/projects/constants";
import { ReportForm } from "@/features/admin/report-form";
import { buttonVariants } from "@/components/ui/button";

/** Page détail d'une solution de l'AfroAtlas (Sprint 6). */
export default async function SolutionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const solution = await db.solution.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { username: true, name: true } },
      projects: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, slug: true, status: true },
      },
    },
  });

  if (!solution) notFound();

  await db.solution.update({
    where: { id: solution.id },
    data: { views: { increment: 1 } },
  });

  const problemRelations = await db.entityRelation.findMany({
    where: {
      sourceType: "SOLUTION",
      sourceId: solution.id,
      relationType: "SOLVES",
      targetType: "PROBLEM",
    },
    orderBy: { createdAt: "asc" },
    select: { targetId: true },
  });
  const problems = problemRelations.length
    ? await db.problem.findMany({
        where: { id: { in: problemRelations.map((item) => item.targetId) } },
        orderBy: { createdAt: "asc" },
        select: { id: true, title: true, slug: true },
      })
    : [];
  const canCreateProject = can(session?.user?.role, "project:create");
  const projectHref = `/projects/new?solution=${encodeURIComponent(solution.id)}${
    problems[0] ? `&problem=${encodeURIComponent(problems[0].id)}` : ""
  }`;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Link
        href="/atlas"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Tout l&apos;Atlas
      </Link>

      <span className="mt-4 block text-xs font-medium uppercase tracking-wide text-primary">
        {SOLUTION_TYPE_LABELS[solution.type]}
      </span>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">
        {solution.name}
      </h1>
      <ContentShare title={solution.name} path={`/atlas/${encodeURIComponent(solution.slug)}`} />
      <p className="mt-2 text-sm text-muted-foreground">
        Référencé par{" "}
        <Link
          href={`/u/${solution.createdBy.username}`}
          className="font-medium text-foreground hover:underline"
        >
          {solution.createdBy.name ?? `@${solution.createdBy.username}`}
        </Link>
      </p>

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {solution.description}
      </div>

      <dl className="mt-8 flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          {solution.views} vue{solution.views > 1 ? "s" : ""}
        </div>
        {solution.country && (
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            {solution.country}
          </div>
        )}
        {solution.license && (
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-muted-foreground" />
            {solution.license}
          </div>
        )}
        {solution.websiteUrl && (
          <a
            href={solution.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent hover:underline"
          >
            <Globe className="size-4" />
            Site web
          </a>
        )}
        {solution.documentationUrl && (
          <a
            href={solution.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent hover:underline"
          >
            <BookOpen className="size-4" />
            Documentation
          </a>
        )}
      </dl>

      <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Problème → Solution → Projet
            </p>
            <h2 className="mt-1 text-xl font-bold">Passer à la construction</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Transformez cette solution en projet collaboratif, reliez-la à un
              dépôt GitHub et rendez sa progression visible par toute la
              communauté.
            </p>
          </div>
          {canCreateProject && (
            <Link href={projectHref} className={buttonVariants({ size: "sm" })}>
              Créer le projet
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        {problems.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground">
              Problème{problems.length > 1 ? "s" : ""} traité
              {problems.length > 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {problems.map((problem) => (
                <Link
                  key={problem.id}
                  href={`/explorer/${problem.slug}`}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                >
                  {problem.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {solution.projects.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground">
              Projet{solution.projects.length > 1 ? "s" : ""} issu
              {solution.projects.length > 1 ? "s" : ""} de cette solution
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {solution.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 font-medium hover:bg-muted"
                >
                  <GitBranch className="size-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {session?.user && (
        <div className="mt-10 border-t border-border pt-4">
          <ReportForm targetType="SOLUTION" targetId={solution.id} />
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return publicContentMetadata("atlas", slug);
}
