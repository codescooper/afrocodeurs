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

/** Libellé, icône et couleurs (Tailwind) du statut dérivé d'une tâche. */
export const DERIVED_STATUS_META: Record<
  DerivedStatus,
  { label: string; icon: string; dot: string; chip: string }
> = {
  DONE: {
    label: "Fait",
    icon: "✅",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700",
  },
  READY: {
    label: "Prête",
    icon: "🟢",
    dot: "bg-amber-400",
    chip: "bg-amber-400/15 text-amber-700",
  },
  CLAIMED: {
    label: "En cours",
    icon: "👤",
    dot: "bg-sky-500",
    chip: "bg-sky-500/10 text-sky-700",
  },
  BLOCKED: {
    label: "Bloquée",
    icon: "🔒",
    dot: "bg-zinc-300",
    chip: "bg-muted text-muted-foreground",
  },
};
