import type { ReputationDimension } from "@prisma/client";

type PointDef = { points: number; dimension: ReputationDimension };

/** Barème de réputation. La clé est stockée dans `ReputationEvent.action`. */
export const REPUTATION_POINTS = {
  QUESTION_ASKED: { points: 2, dimension: "PARTICIPATION" },
  COMMENT_POSTED: { points: 1, dimension: "PARTICIPATION" },
  COMMUNITY_JOINED: { points: 1, dimension: "PARTICIPATION" },
  ANSWER_POSTED: { points: 5, dimension: "CONTRIBUTION" },
  ANSWER_ACCEPTED: { points: 15, dimension: "CONTRIBUTION" },
  KNOWLEDGE_PUBLISHED: { points: 20, dimension: "CONTRIBUTION" },
  PROBLEM_PROPOSED: { points: 8, dimension: "CONTRIBUTION" },
  SOLUTION_ADDED: { points: 8, dimension: "CONTRIBUTION" },
  RELATION_ADDED: { points: 3, dimension: "CONTRIBUTION" },
  PROJECT_CREATED: { points: 8, dimension: "CONTRIBUTION" },
  TASK_COMPLETED: { points: 10, dimension: "CONTRIBUTION" },
  CHALLENGE_CREATED: { points: 25, dimension: "CONTRIBUTION" },
  CHALLENGE_SOLVED: { points: 10, dimension: "PARTICIPATION" },
} as const satisfies Record<string, PointDef>;

export type ReputationAction = keyof typeof REPUTATION_POINTS;

/** Libellés publics du barème, gardés à côté des valeurs pour rester synchronisés. */
export const REPUTATION_ACTION_LABELS: Record<ReputationAction, string> = {
  QUESTION_ASKED: "Poser une question",
  COMMENT_POSTED: "Publier un commentaire",
  COMMUNITY_JOINED: "Rejoindre une communauté",
  ANSWER_POSTED: "Proposer une réponse",
  ANSWER_ACCEPTED: "Voir sa réponse acceptée",
  KNOWLEDGE_PUBLISHED: "Publier une ressource validée",
  PROBLEM_PROPOSED: "Proposer un problème",
  SOLUTION_ADDED: "Ajouter une solution",
  RELATION_ADDED: "Relier deux contenus utiles",
  PROJECT_CREATED: "Référencer un projet",
  TASK_COMPLETED: "Terminer une tâche de projet",
  CHALLENGE_CREATED: "Créer une énigme validée",
  CHALLENGE_SOLVED: "Résoudre une énigme",
};

/** Points gagnés (ou perdus) par l'auteur d'un contenu pour chaque upvote reçu. */
export const UPVOTE_POINTS = 10;

export type ReputationLevel = { min: number; label: string };

/** Échelle de progression de l'AfroMaker (Build Before Consume). */
export const REPUTATION_LEVELS: ReputationLevel[] = [
  { min: 0, label: "Curieux·se" },
  { min: 25, label: "Apprenti·e" },
  { min: 100, label: "Maker" },
  { min: 300, label: "Bâtisseur·se" },
  { min: 750, label: "Pilier" },
  { min: 1500, label: "Légende" },
];

/** Niveau atteint pour un total de points donné. */
export function levelForPoints(total: number): ReputationLevel {
  let current = REPUTATION_LEVELS[0];
  for (const lvl of REPUTATION_LEVELS) {
    if (total >= lvl.min) current = lvl;
  }
  return current;
}

/** Prochain niveau à atteindre (null si déjà au sommet). */
export function nextLevel(total: number): ReputationLevel | null {
  return REPUTATION_LEVELS.find((l) => l.min > total) ?? null;
}
