import { Briefcase } from "lucide-react";

import { EntityCard } from "@/components/molecules/entity-card";
import { FilterPills } from "@/components/molecules/filter-pills";

export const metadata = { title: "Opportunités" };

const EXAMPLE_OPPORTUNITIES = [
  {
    title: "Développeur·se Next.js — remote Afrique",
    company: "Pixel-Mart",
    contract: "CDI",
    location: "Remote · Afrique de l'Ouest",
  },
  {
    title: "Stage Data / IA appliquée à l'agriculture",
    company: "AgriTech Bénin",
    contract: "Stage",
    location: "Cotonou, Bénin",
  },
  {
    title: "Bourse — Concours FinTech panafricain",
    company: "AfroCodeurs × partenaires",
    contract: "Bourse",
    location: "Continent",
  },
];

/**
 * Placeholder v1 conforme au PRD (AfroOpportunities — cf. PRD fondateur
 * §AfroOpportunities, PRD produit V1). Le module complet (emplois, stages,
 * concours, bourses) arrive en v2 ; les cartes ci-dessous sont des exemples
 * fictifs pour prévisualiser la disposition (façon LinkedIn Jobs).
 */
export default function OpportunitiesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">AfroOpportunities</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Emplois, stages, concours, bourses et financements pour les
        AfroMakers — chaque opportunité reliée aux problèmes réels du
        continent.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Module en cours de construction — arrive en v2. Aperçu ci-dessous avec
        des exemples fictifs, pour montrer à quoi ça ressemblera.
      </div>

      <div className="mt-8 opacity-70">
        <FilterPills
          baseHref="/opportunities"
          paramName="type"
          options={[
            { label: "CDI", value: "cdi", count: 0 },
            { label: "Stage", value: "stage", count: 0 },
            { label: "Bourse", value: "bourse", count: 0 },
          ]}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 opacity-70">
        {EXAMPLE_OPPORTUNITIES.map((job) => (
          <EntityCard
            key={job.title}
            icon={Briefcase}
            eyebrow={job.company}
            badge={job.contract}
            title={job.title}
            meta={job.location}
          />
        ))}
      </div>
    </div>
  );
}
