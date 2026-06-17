import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Globe, TrendingUp } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, hasRank } from "@/lib/permissions";
import { PROBLEM_STATUS_LABELS } from "@/features/problems/constants";
import {
  getLinkCandidates,
  getProblemRelations,
} from "@/features/relations/queries";
import { unlinkFromProblemAction } from "@/features/relations/actions";
import { LinkForm } from "@/features/relations/link-form";
import { ReportForm } from "@/features/admin/report-form";
import { SaveButton } from "@/features/bookmarks/save-button";
import { isBookmarked } from "@/features/bookmarks/queries";

/** Page détail d'un problème (Sprint 3). */
export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const problem = await db.problem.findUnique({
    where: { slug },
    include: { createdBy: { select: { username: true, name: true } } },
  });

  if (!problem) notFound();

  await db.problem.update({
    where: { id: problem.id },
    data: { views: { increment: 1 } },
  });

  const linked = await getProblemRelations(problem.id);
  const canLink = can(session?.user?.role, "relation:create");
  const isStaff = session?.user
    ? hasRank(session.user.role, "MODERATOR")
    : false;
  const candidates = canLink
    ? await getLinkCandidates(
        linked.filter((i) => i.kind === "SOLUTION").map((i) => i.sourceId),
        linked.filter((i) => i.kind === "KNOWLEDGE").map((i) => i.sourceId),
      )
    : { solutions: [], knowledge: [] };

  const savedProblem = await isBookmarked(
    session?.user?.id,
    "PROBLEM",
    problem.id,
  );

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
        <span className="flex items-center gap-1.5">
          <Eye className="size-4" />
          {problem.views} vue{problem.views > 1 ? "s" : ""}
        </span>
        {problem.countries.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Globe className="size-4" />
            {problem.countries.join(", ")}
          </span>
        )}
      </div>

      {session?.user && (
        <div className="mt-4">
          <SaveButton
            targetType="PROBLEM"
            targetId={problem.id}
            initialSaved={savedProblem}
          />
        </div>
      )}

      {problem.summary && (
        <p className="mt-6 text-lg text-muted-foreground">{problem.summary}</p>
      )}

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
        {problem.description}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Solutions et ressources liées
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce que la communauté a déjà identifié pour répondre à ce problème.
        </p>

        {linked.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aucun lien pour le moment.
            {canLink ? " Soyez le premier à en proposer un ci-dessous." : ""}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {linked.map((item) => {
              const canUnlink =
                isStaff ||
                (session?.user && item.createdById === session.user.id);
              return (
                <li
                  key={item.relationId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-2"
                >
                  <Link href={item.href} className="font-medium hover:underline">
                    {item.title}
                  </Link>
                  <span className="flex items-center gap-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {item.kind === "SOLUTION" ? "Solution" : "Ressource"} ·{" "}
                      {item.badge}
                    </span>
                    {canUnlink && (
                      <form action={unlinkFromProblemAction}>
                        <input
                          type="hidden"
                          name="relationId"
                          value={item.relationId}
                        />
                        <input type="hidden" name="slug" value={problem.slug} />
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Retirer
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {canLink && (
          <div className="mt-4">
            <LinkForm
              problemId={problem.id}
              slug={problem.slug}
              candidates={candidates}
            />
          </div>
        )}
      </section>

      {session?.user && (
        <div className="mt-10 border-t border-border pt-4">
          <ReportForm targetType="PROBLEM" targetId={problem.id} />
        </div>
      )}
    </div>
  );
}
