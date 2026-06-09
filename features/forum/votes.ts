import "server-only";

import type { EntityType, VoteValue } from "@prisma/client";

import { db } from "@/lib/db";

export type VoteTally = { score: number; mine: VoteValue | null };

/**
 * Calcule le score (UP − DOWN) et le vote de l'utilisateur courant pour un
 * ensemble de cibles, en une seule requête. Les ids (cuid) étant uniques tous
 * types confondus, la map est indexée par targetId.
 */
export async function tallyVotes(
  targets: { type: EntityType; id: string }[],
  userId?: string,
): Promise<Map<string, VoteTally>> {
  const map = new Map<string, VoteTally>();
  for (const t of targets) map.set(t.id, { score: 0, mine: null });
  if (targets.length === 0) return map;

  const votes = await db.vote.findMany({
    where: {
      OR: targets.map((t) => ({ targetType: t.type, targetId: t.id })),
    },
    select: { targetId: true, value: true, userId: true },
  });

  for (const vote of votes) {
    const entry = map.get(vote.targetId);
    if (!entry) continue;
    entry.score += vote.value === "UP" ? 1 : -1;
    if (userId && vote.userId === userId) entry.mine = vote.value;
  }

  return map;
}
