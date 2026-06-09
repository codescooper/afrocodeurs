import type { ProblemStatus } from "@prisma/client";

/** Libellés FR des statuts de problème (cf. schéma Prisma `ProblemStatus`). */
export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  PROPOSED: "Proposé",
  VALIDATED: "Validé",
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
};
