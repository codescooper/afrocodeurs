import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Opportunités" };

/** Placeholder v1 conforme au PRD (AfroOpportunities — cf. PRD fondateur §AfroOpportunities, PRD produit V1). */
export default function OpportunitiesPage() {
  return (
    <PagePlaceholder
      title="AfroOpportunities"
      description="Emplois, stages, concours, bourses et financements pour les AfroMakers — chaque opportunité reliée aux problèmes réels du continent."
      sprint="arrive en v2"
    />
  );
}
