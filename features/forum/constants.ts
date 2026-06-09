import type { QuestionStatus } from "@prisma/client";

/** Libellés FR des statuts de question (cf. schéma Prisma `QuestionStatus`). */
export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  OPEN: "Ouverte",
  ANSWERED: "Répondue",
  SOLVED: "Résolue",
  CLOSED: "Fermée",
};
