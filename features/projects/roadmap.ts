import type { TaskState } from "@prisma/client";

/**
 * Statut dérivé d'une tâche de roadmap, calculé à la lecture (jamais stocké) :
 * - DONE    : tâche terminée (issue GitHub fermée)
 * - BLOCKED : au moins un prérequis n'est pas terminé
 * - CLAIMED : prête et déjà prise en charge (assignee présent) — « qui fait quoi »
 * - READY   : prête et disponible (aucun assignee) — à prendre
 */
export type DerivedStatus = "DONE" | "BLOCKED" | "CLAIMED" | "READY";

/**
 * Calcule le statut dérivé d'une tâche à partir de son état GitHub, de ses
 * assignees et de l'état de ses prérequis directs. Fonction pure (testée).
 *
 * Le blocage transitif est géré naturellement : un prérequis non terminé bloque,
 * qu'il soit lui-même prêt ou bloqué — on ne peut commencer qu'une fois TOUS
 * les prérequis directs terminés.
 */
export function deriveTaskStatus(
  task: { state: TaskState; assignees: string[] },
  prerequisiteStates: TaskState[],
): DerivedStatus {
  if (task.state === "CLOSED") return "DONE";
  if (prerequisiteStates.some((s) => s !== "CLOSED")) return "BLOCKED";
  return task.assignees.length > 0 ? "CLAIMED" : "READY";
}

/** Une tâche est « indépendante » si elle n'a aucun lien de dépendance (DAG). */
export function isIndependent(
  prerequisiteCount: number,
  dependentCount: number,
): boolean {
  return prerequisiteCount === 0 && dependentCount === 0;
}
