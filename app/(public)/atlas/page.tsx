import { paginatedPath, publicMetadata } from "@/lib/seo";
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
import { ProductCard } from "@/components/molecules/product-card";
import { SuggestionsRail } from "@/components/organisms/suggestions-rail";
import { catalogFilters, LIFECYCLES, SECTORS, normalizeCatalogParams } from "@/features/solutions/catalog";
import { SOLUTION_TYPES } from "@/features/solutions/constants";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return publicMetadata(paginatedPath("/atlas", page), "Atlas des solutions pour l’Afrique", "Trouvez des solutions aux réalités africaines : secteur, pays d’utilisation, langues, licence open source vérifiée et pistes pour contribuer.");
}

/** AfroAtlas Lite — annuaire des solutions (Sprint 6), façon Product Hunt. */
export default async function AtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; sector?: string; country?: string; language?: string; license?: string; lifecycle?: string; open?: string }>;
}) {
  const filters = normalizeCatalogParams(await searchParams);
  const type = SOLUTION_TYPES.includes(filters.type as SolutionType) ? filters.type as SolutionType : undefined;
  const session = await auth();

  const [solutions, typeCounts] = await Promise.all([
    db.solution.findMany({
      where: { ...catalogFilters(filters), ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.solution.groupBy({ by: ["type"], _count: { type: true } }),
  ]);

  const tallies = await tallyVotes(
    solutions.map((s) => ({ type: "SOLUTION" as const, id: s.id })),
  );

  return (
    <HubTemplate
      title="Atlas des solutions"
      description="Découvrez les solutions utiles aux réalités africaines, retrouvez leurs créateurs et contribuez à ce qui existe déjà."
      rail={<SuggestionsRail />}
      action={
        session?.user ? (
          <Link href="/atlas/new" className={buttonVariants({ size: "sm" })}>
            Ajouter une solution
          </Link>
        ) : undefined
      }
    >
      <form action="/atlas" method="get" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">Type<select name="type" defaultValue={type ?? ""} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"><option value="">Tous</option>{typeCounts.map(item => <option key={item.type} value={item.type}>{SOLUTION_TYPE_LABELS[item.type]} ({item._count.type})</option>)}</select></label>
        <label className="text-sm">Problème ou solution<input name="q" defaultValue={filters.q} maxLength={120} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" /></label>
        <label className="text-sm">Secteur<select name="sector" defaultValue={filters.sector ?? ""} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"><option value="">Tous</option>{Object.entries(SECTORS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm">État<select name="lifecycle" defaultValue={filters.lifecycle ?? ""} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"><option value="">Tous</option>{Object.entries(LIFECYCLES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        {([['country', 'Pays d’utilisation'], ['language', 'Langue'], ['license', 'Licence']] as const).map(([name, label]) => <label key={name} className="text-sm">{label}<input name={name} defaultValue={filters[name]} maxLength={80} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" /></label>)}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="open" value="1" defaultChecked={filters.open === "1"} />Licence open source vérifiée uniquement</label>
        <div className="flex items-center gap-4"><button type="submit" className={buttonVariants({ size: "sm" })}>Filtrer</button><Link href="/atlas" className="text-sm underline">Réinitialiser</Link></div>
      </form>
      <p className="mb-5 text-sm text-muted-foreground">Un dépôt public ne garantit pas une licence open source. Le pays d’origine est distinct des pays d’utilisation. Les informations non vérifiées restent signalées.</p>
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
                eyebrow={`${SOLUTION_TYPE_LABELS[solution.type]} · ${solution.licenseVerified ? "Licence vérifiée" : "Licence à vérifier"}`}
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
      {solutions.length === 100 && <p className="mt-5 text-sm">Les 100 solutions les plus récentes sont affichées. Affinez les filtres pour trouver une solution précise.</p>}
    </HubTemplate>
  );
}
