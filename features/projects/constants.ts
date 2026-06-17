import type { ProjectStatus } from "@prisma/client";

import type { DerivedStatus } from "./roadmap";

/** Libellés FR des statuts de projet (cf. cycle incubateur, schéma `ProjectStatus`). */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  IDEA: "Idée",
  VALIDATING: "Validation",
  BUILDING: "Construction",
  PROTOTYPE: "Prototype",
  DEPLOYED: "Déployé",
  MAINTAINED: "Maintenu",
  ARCHIVED: "Archivé",
};

/** Statuts ordonnés pour les menus déroulants. */
export const PROJECT_STATUSES = Object.keys(
  PROJECT_STATUS_LABELS,
) as ProjectStatus[];

/** Libellé + pastille du statut dérivé d'une tâche de roadmap. */
export const DERIVED_STATUS_META: Record<
  DerivedStatus,
  { label: string; icon: string }
> = {
  DONE: { label: "Fait", icon: "✅" },
  READY: { label: "Prête", icon: "🟢" },
  CLAIMED: { label: "En cours", icon: "👤" },
  BLOCKED: { label: "Bloquée", icon: "🔒" },
};
