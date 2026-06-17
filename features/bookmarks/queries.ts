import "server-only";

import type { EntityType } from "@prisma/client";

import { db } from "@/lib/db";

export async function isBookmarked(
  userId: string | undefined | null,
  targetType: EntityType,
  targetId: string,
): Promise<boolean> {
  if (!userId) return false;
  return Boolean(
    await db.bookmark.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      select: { id: true },
    }),
  );
}

export type SavedItem = {
  kind: string;
  title: string;
  href: string;
};

/** Résout les favoris d'un utilisateur en {kind, titre, lien}, ordre récent. */
export async function getSavedItems(userId: string): Promise<SavedItem[]> {
  const bookmarks = await db.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  if (bookmarks.length === 0) return [];

  const byType: Partial<Record<EntityType, string[]>> = {};
  for (const b of bookmarks) {
    (byType[b.targetType] ??= []).push(b.targetId);
  }

  const [problems, knowledge, questions, solutions] = await Promise.all([
    byType.PROBLEM
      ? db.problem.findMany({
          where: { id: { in: byType.PROBLEM } },
          select: { id: true, title: true, slug: true },
        })
      : [],
    byType.KNOWLEDGE
      ? db.knowledge.findMany({
          where: { id: { in: byType.KNOWLEDGE } },
          select: { id: true, title: true, slug: true },
        })
      : [],
    byType.QUESTION
      ? db.question.findMany({
          where: { id: { in: byType.QUESTION } },
          select: { id: true, title: true, slug: true },
        })
      : [],
    byType.SOLUTION
      ? db.solution.findMany({
          where: { id: { in: byType.SOLUTION } },
          select: { id: true, name: true, slug: true },
        })
      : [],
  ]);

  const map = new Map<string, SavedItem>();
  for (const p of problems)
    map.set(`PROBLEM:${p.id}`, {
      kind: "Problème",
      title: p.title,
      href: `/explorer/${p.slug}`,
    });
  for (const k of knowledge)
    map.set(`KNOWLEDGE:${k.id}`, {
      kind: "Ressource",
      title: k.title,
      href: `/knowledge/${k.slug}`,
    });
  for (const q of questions)
    map.set(`QUESTION:${q.id}`, {
      kind: "Question",
      title: q.title,
      href: `/forum/${q.slug}`,
    });
  for (const s of solutions)
    map.set(`SOLUTION:${s.id}`, {
      kind: "Solution",
      title: s.name,
      href: `/atlas/${s.slug}`,
    });

  const out: SavedItem[] = [];
  for (const b of bookmarks) {
    const item = map.get(`${b.targetType}:${b.targetId}`);
    if (item) out.push(item);
  }
  return out;
}
