import "server-only";

import { db } from "@/lib/db";
import {
  levelForPoints,
  nextLevel,
  type ReputationLevel,
} from "./constants";

export type Reputation = {
  total: number;
  participation: number;
  contribution: number;
  level: ReputationLevel;
  next: ReputationLevel | null;
};

/** Réputation d'un utilisateur (somme du registre), par dimension + niveau. */
export async function getReputation(userId: string): Promise<Reputation> {
  const rows = await db.reputationEvent.groupBy({
    by: ["dimension"],
    where: { userId },
    _sum: { points: true },
  });

  let participation = 0;
  let contribution = 0;
  for (const r of rows) {
    const sum = r._sum.points ?? 0;
    if (r.dimension === "PARTICIPATION") participation = sum;
    else if (r.dimension === "CONTRIBUTION") contribution = sum;
  }
  const total = participation + contribution;

  return {
    total,
    participation,
    contribution,
    level: levelForPoints(total),
    next: nextLevel(total),
  };
}

export type LeaderboardRow = {
  user: { id: string; username: string; name: string | null };
  points: number;
};

/** Classement des AfroMakers par réputation totale (décroissant). */
export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const grouped = await db.reputationEvent.groupBy({
    by: ["userId"],
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: limit,
  });
  const ids = grouped.map((g) => g.userId);
  if (ids.length === 0) return [];

  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, username: true, name: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const out: LeaderboardRow[] = [];
  for (const g of grouped) {
    const user = byId.get(g.userId);
    if (user) out.push({ user, points: g._sum.points ?? 0 });
  }
  return out;
}
