import "server-only";

import { db } from "@/lib/db";
import { SOLUTION_TYPE_LABELS } from "@/features/solutions/constants";
import { KNOWLEDGE_TYPE_LABELS } from "@/features/knowledge/constants";

export type LinkedItem = {
  relationId: string;
  kind: "SOLUTION" | "KNOWLEDGE";
  sourceId: string;
  title: string;
  href: string;
  badge: string;
  createdById: string | null;
};

/**
 * Solutions (SOLVES) et ressources publiées (EXPLAINS) liées à un problème
 * via EntityRelation (cf. PRD : tout doit pouvoir être relié à un problème).
 */
export async function getProblemRelations(
  problemId: string,
): Promise<LinkedItem[]> {
  const relations = await db.entityRelation.findMany({
    where: {
      targetType: "PROBLEM",
      targetId: problemId,
      sourceType: { in: ["SOLUTION", "KNOWLEDGE"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (relations.length === 0) return [];

  const solutionIds = relations
    .filter((r) => r.sourceType === "SOLUTION")
    .map((r) => r.sourceId);
  const knowledgeIds = relations
    .filter((r) => r.sourceType === "KNOWLEDGE")
    .map((r) => r.sourceId);

  const [solutions, knowledge] = await Promise.all([
    solutionIds.length
      ? db.solution.findMany({
          where: { id: { in: solutionIds } },
          select: { id: true, name: true, slug: true, type: true },
        })
      : [],
    knowledgeIds.length
      ? db.knowledge.findMany({
          where: { id: { in: knowledgeIds }, status: "PUBLISHED" },
          select: { id: true, title: true, slug: true, type: true },
        })
      : [],
  ]);

  const items: LinkedItem[] = [];
  for (const relation of relations) {
    if (relation.sourceType === "SOLUTION") {
      const s = solutions.find((x) => x.id === relation.sourceId);
      if (s) {
        items.push({
          relationId: relation.id,
          kind: "SOLUTION",
          sourceId: s.id,
          title: s.name,
          href: `/atlas/${s.slug}`,
          badge: SOLUTION_TYPE_LABELS[s.type],
          createdById: relation.createdById,
        });
      }
    } else {
      const k = knowledge.find((x) => x.id === relation.sourceId);
      if (k) {
        items.push({
          relationId: relation.id,
          kind: "KNOWLEDGE",
          sourceId: k.id,
          title: k.title,
          href: `/knowledge/${k.slug}`,
          badge: KNOWLEDGE_TYPE_LABELS[k.type],
          createdById: relation.createdById,
        });
      }
    }
  }
  return items;
}

export type LinkCandidates = {
  solutions: { id: string; name: string }[];
  knowledge: { id: string; title: string }[];
};

/** Solutions et ressources publiées liables (hors éléments déjà liés). */
export async function getLinkCandidates(
  excludeSolutionIds: string[],
  excludeKnowledgeIds: string[],
): Promise<LinkCandidates> {
  const [solutions, knowledge] = await Promise.all([
    db.solution.findMany({
      where: { id: { notIn: excludeSolutionIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.knowledge.findMany({
      where: { status: "PUBLISHED", id: { notIn: excludeKnowledgeIds } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);
  return { solutions, knowledge };
}
