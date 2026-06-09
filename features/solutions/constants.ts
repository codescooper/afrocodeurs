import type { SolutionType } from "@prisma/client";

/** Libellés FR des types de solution (cf. schéma Prisma `SolutionType`). */
export const SOLUTION_TYPE_LABELS: Record<SolutionType, string> = {
  SOFTWARE: "Logiciel",
  API: "API",
  STARTUP: "Startup",
  ORGANIZATION: "Organisation",
  SERVICE: "Service",
};

export const SOLUTION_TYPES = Object.keys(
  SOLUTION_TYPE_LABELS,
) as SolutionType[];
