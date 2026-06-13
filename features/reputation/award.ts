import "server-only";

import type { EntityType } from "@prisma/client";

import { db } from "@/lib/db";
import { REPUTATION_POINTS, UPVOTE_POINTS, type ReputationAction } from "./constants";

type Target = { type?: EntityType; id?: string };

/**
 * Attribue de la réputation à un utilisateur pour une action.
 * Best-effort : un échec n'interrompt jamais l'action déclenchante.
 */
export async function award(
  userId: string | null | undefined,
  action: ReputationAction,
  target?: Target,
): Promise<void> {
  if (!userId) return;
  const def = REPUTATION_POINTS[action];
  try {
    await db.reputationEvent.create({
      data: {
        userId,
        action,
        points: def.points,
        dimension: def.dimension,
        targetType: target?.type ?? null,
        targetId: target?.id ?? null,
      },
    });
  } catch {
    /* la réputation ne doit jamais casser l'action */
  }
}

/**
 * Ajuste la réputation de l'auteur d'un contenu suite à un (dé)vote.
 * `deltaUpvotes` vaut +1 (upvote ajouté) ou -1 (upvote retiré).
 */
export async function awardVote(
  userId: string | null | undefined,
  deltaUpvotes: number,
  target: Target,
): Promise<void> {
  if (!userId || deltaUpvotes === 0) return;
  try {
    await db.reputationEvent.create({
      data: {
        userId,
        action: deltaUpvotes > 0 ? "UPVOTE_RECEIVED" : "UPVOTE_REMOVED",
        points: deltaUpvotes * UPVOTE_POINTS,
        dimension: "CONTRIBUTION",
        targetType: target.type ?? null,
        targetId: target.id ?? null,
      },
    });
  } catch {
    /* ignore */
  }
}
