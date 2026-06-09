import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PROBLEM_STATUS_LABELS } from "@/features/problems/constants";

export const metadata = { title: "Explorer les problèmes" };

/** Problem Hub — liste des problèmes du continent (Sprint 3). */
export default async function ExplorerPage() {
  const session = await auth();
  const problems = await db.problem.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { username: true, name: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Problem Hub</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Explorez les problèmes du continent par secteur, pays et niveau
            d&apos;impact.
          </p>
        </div>
        {session?.user && (
          <Link
            href="/explorer/new"
            className={buttonVariants({ size: "sm" })}
          >
            Proposer un problème
          </Link>
        )}
      </div>

      {problems.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun problème pour le moment. Proposez le premier !
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              href={`/explorer/${problem.slug}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {problem.sector}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {PROBLEM_STATUS_LABELS[problem.status]}
                </span>
              </div>
              <h2 className="font-semibold">{problem.title}</h2>
              {problem.summary && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {problem.summary}
                </p>
              )}
              <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="size-3.5" />
                Impact {problem.impactLevel}/5 · Difficulté{" "}
                {problem.difficultyLevel}/5
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
