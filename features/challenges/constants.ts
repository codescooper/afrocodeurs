import type { ChallengeDifficulty, ChallengeStatus } from "@prisma/client";

export const CHALLENGE_DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  INITIATE: "Initié",
  EXPLORER: "Explorateur",
  HACKER: "Hacker culturel",
  MASTER: "Maître du baobab",
  LEGENDARY: "Légendaire",
};

export const CHALLENGE_BASE_POINTS: Record<ChallengeDifficulty, number> = {
  INITIATE: 50,
  EXPLORER: 100,
  HACKER: 200,
  MASTER: 400,
  LEGENDARY: 800,
};

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "En validation",
  TESTING: "En test",
  SCHEDULED: "Programmée",
  PUBLISHED: "En cours",
  CLOSED: "Terminée",
  REJECTED: "Rejetée",
  ARCHIVED: "Archivée",
};

export const HINT_PENALTIES = [10, 25, 40] as const;

export function challengeScore(base: number, attempts: number, penalties: number) {
  const attemptPenalty = Math.max(0, attempts - 1) * Math.ceil(base * 0.03);
  return Math.max(10, base - penalties - attemptPenalty);
}
