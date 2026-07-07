import Link from "next/link";
import { MapPin } from "lucide-react";
import type { SolutionType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { excerpt } from "@/lib/markdown";
import { SOLUTION_TYPE_LABELS } from "@/features/solutions/constants";
import { tallyVotes } from "@/features/forum/votes";
import { HubTemplate } from "@/components/templates/hub-template";
import { EmptyState } from "@/components/atoms/empty-state";
import { FilterPills } from "@/components/molecules/filter-pills";
import { ProductCard } from "@/components/molecules/product-card";
import { SuggestionsRail } from "@/components/organisms/suggestions-rail";

export const metadata = { title: "AfroAtlas" };

/** AfroAtlas Lite — annuaire des solutions (Sprint 6), façon Product Hunt. */
export default async function AtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const session = await auth();

  const [solutions, typeCounts] = await Promise.all([
    db.solution.findMany({
      where: type ? { type: type as SolutionType } : undefined,
      orderBy: { createdAt: "desc" },
    }),
    db.solution.groupBy({ by: ["type"], _count: { type: true } }),
  ]);

  const tallies = await tallyVotes(
    solutions.map((s) => ({ type: "SOLUTION" as const, id: s.id })),
  );

  return (
    <HubTemplate
      title="AfroAtlas"
      description="Solutions, APIs, startups et organisations technologiques africaines."
      rail={<SuggestionsRail />}
      action={
        session?.user ? (
          <Link href="/atlas/new" className={buttonVariants({ size: "sm" })}>
            Ajouter une solution
          </Link>
        ) : undefined
      }
    >
      {typeCounts.length > 0 && (
        <div className="mb-6">
          <FilterPills
            baseHref="/atlas"
            paramName="type"
            active={type}
            options={typeCounts.map((t) => ({
              label: SOLUTION_TYPE_LABELS[t.type],
              value: t.type,
              count: t._count.type,
            }))}
          />
        </div>
      )}

      {solutions.length === 0 ? (
        <EmptyState>
          {type
            ? "Aucune solution de ce type pour l'instant."
            : "L'Atlas est vide. Ajoutez la première solution !"}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {solutions.map((solution) => {
            const tally = tallies.get(solution.id) ?? { score: 0, mine: null };
            return (
              <ProductCard
                key={solution.id}
                href={`/atlas/${solution.slug}`}
                name={solution.name}
                eyebrow={SOLUTION_TYPE_LABELS[solution.type]}
                description={excerpt(solution.description)}
                score={tally.score}
                meta={
                  solution.country ? (
                    <>
                      <MapPin className="size-3.5" />
                      {solution.country}
                    </>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}
    </HubTemplate>
  );
}
