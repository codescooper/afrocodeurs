import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PROBLEM_STATUS_LABELS } from "@/features/problems/constants";
import { HubTemplate } from "@/components/templates/hub-template";
import { EntityCard } from "@/components/molecules/entity-card";
import { EmptyState } from "@/components/atoms/empty-state";
import { LevelBar } from "@/components/atoms/level-bar";
import { sectorIcon } from "@/components/atoms/sector-icon";
import { SuggestionsRail } from "@/components/organisms/suggestions-rail";
import { FilterPills } from "@/components/molecules/filter-pills";

export const metadata = { title: "Explorer les problèmes" };

/** Problem Hub — liste des problèmes du continent (Sprint 3), filtrable par secteur. */
export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>;
}) {
  const { sector } = await searchParams;
  const [session, problems, sectorCounts] = await Promise.all([
    auth(),
    db.problem.findMany({
      where: sector ? { sector } : undefined,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { username: true, name: true } } },
    }),
    db.problem.groupBy({
      by: ["sector"],
      _count: { sector: true },
      orderBy: { sector: "asc" },
    }),
  ]);

  return (
    <HubTemplate
      title="Problem Hub"
      description="Explorez les problèmes du continent par secteur, pays et niveau d'impact."
      rail={<SuggestionsRail />}
      action={
        session?.user ? (
          <Link href="/explorer/new" className={buttonVariants({ size: "sm" })}>
            Proposer un problème
          </Link>
        ) : undefined
      }
    >
      {sectorCounts.length > 0 && (
        <div className="mb-6">
          <FilterPills
            baseHref="/explorer"
            paramName="sector"
            active={sector}
            options={sectorCounts.map((s) => ({
              label: s.sector,
              value: s.sector,
              count: s._count.sector,
            }))}
          />
        </div>
      )}

      {problems.length === 0 ? (
        <EmptyState>
          {sector
            ? "Aucun problème dans ce secteur pour l'instant."
            : "Aucun problème pour le moment. Proposez le premier !"}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {problems.map((problem) => (
            <EntityCard
              key={problem.id}
              href={`/explorer/${problem.slug}`}
              icon={sectorIcon(problem.sector)}
              eyebrow={problem.sector}
              badge={PROBLEM_STATUS_LABELS[problem.status]}
              title={problem.title}
              description={problem.summary ?? undefined}
              meta={
                <div className="flex flex-col gap-1">
                  <LevelBar label="Impact" value={problem.impactLevel} />
                  <LevelBar label="Difficulté" value={problem.difficultyLevel} />
                </div>
              }
            />
          ))}
        </div>
      )}
    </HubTemplate>
  );
}
