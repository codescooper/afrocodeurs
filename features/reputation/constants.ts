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
} as const satisfies Record<string, PointDef>;

export type ReputationAction = keyof typeof REPUTATION_POINTS;

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
