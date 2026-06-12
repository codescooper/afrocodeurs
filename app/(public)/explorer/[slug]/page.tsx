import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, TrendingUp } from "lucide-react";

import { db } from "@/lib/db";
import { PROBLEM_STATUS_LABELS } from "@/features/problems/constants";

/** Page détail d'un problème (Sprint 3). */
export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const problem = await db.problem.findUnique({
    where: { slug },
    include: { createdBy: { select: { username: true, name: true } } },
  });

  if (!problem) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Link
        href="/explorer"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Tous les problèmes
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-primary">
          {problem.sector}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {PROBLEM_STATUS_LABELS[problem.status]}
        </span>
      </div>

      <h1 className="mt-1 text-3xl font-bold tracking-tight">
        {problem.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Proposé par{" "}
        <Link
          href={`/u/${problem.createdBy.username}`}
          className="font-medium text-foreground hover:underline"
        >
          {problem.createdBy.name ?? `@${problem.createdBy.username}`}
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="size-4" />
          Impact {problem.impactLevel}/5 · Difficulté {problem.difficultyLevel}
          /5
        </span>
        {problem.countries.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Globe className="size-4" />
            {problem.countries.join(", ")}
          </span>
        )}
      </div>

      {problem.summary && (
        <p className="mt-6 text-lg text-muted-foreground">{problem.summary}</p>
      )}

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {problem.description}
      </div>

      <section className="mt-10 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Ressources et solutions liées — bientôt (Sprints 4 &amp; 6).
      </section>
    </div>
  );
}
