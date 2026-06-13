"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, hasRank } from "@/lib/permissions";
import { notify } from "@/features/notifications/notify";

export type LinkFormState = { error?: string } | undefined;

/**
 * Lier une solution (SOLVES) ou une ressource publiée (EXPLAINS) à un
 * problème. La cible arrive encodée « SOLUTION:<id> » / « KNOWLEDGE:<id> ».
 */
export async function linkToProblemAction(
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "relation:create")) {
    return { error: "Action non autorisée." };
  }

  const problemId = formData.get("problemId");
  const slug = formData.get("slug");
  const target = formData.get("target");
  if (typeof problemId !== "string" || typeof target !== "string") {
    return { error: "Cible invalide." };
  }

  const [rawType, sourceId] = target.split(":");
  if ((rawType !== "SOLUTION" && rawType !== "KNOWLEDGE") || !sourceId) {
    return { error: "Cible invalide." };
  }

  const problem = await db.problem.findUnique({
    where: { id: problemId },
    select: { id: true, createdById: true, title: true },
  });
  if (!problem) return { error: "Problème introuvable." };

  if (rawType === "SOLUTION") {
    const exists = await db.solution.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });
    if (!exists) return { error: "Solution introuvable." };
  } else {
    const exists = await db.knowledge.findFirst({
      where: { id: sourceId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!exists) return { error: "Ressource introuvable." };
  }

  const relationType = rawType === "SOLUTION" ? "SOLVES" : "EXPLAINS";

  await db.entityRelation.upsert({
    where: {
      sourceType_sourceId_relationType_targetType_targetId: {
        sourceType: rawType,
        sourceId,
        relationType,
        targetType: "PROBLEM",
        targetId: problemId,
      },
    },
    update: {},
    create: {
      sourceType: rawType,
      sourceId,
      relationType,
      targetType: "PROBLEM",
      targetId: problemId,
      createdById: session.user.id,
    },
  });

  await notify({
    userId: problem.createdById,
    actorId: session.user.id,
    type: "PROBLEM_LINK",
    title: "Une piste a été liée à ton problème",
    body: `Quelqu'un a lié une ${
      rawType === "SOLUTION" ? "solution" : "ressource"
    } à « ${problem.title} ».`,
    link: typeof slug === "string" ? `/explorer/${slug}` : null,
  });

  if (typeof slug === "string") revalidatePath(`/explorer/${slug}`);
  return undefined;
}

/** Retirer un lien — réservé à son créateur ou aux MODERATOR+. */
export async function unlinkFromProblemAction(
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const relationId = formData.get("relationId");
  const slug = formData.get("slug");
  if (typeof relationId !== "string") return;

  const relation = await db.entityRelation.findUnique({
    where: { id: relationId },
    select: { id: true, createdById: true },
  });
  if (!relation) return;

  const allowed =
    relation.createdById === session.user.id ||
    hasRank(session.user.role, "MODERATOR");
  if (!allowed) return;

  await db.entityRelation.delete({ where: { id: relationId } });
  if (typeof slug === "string") revalidatePath(`/explorer/${slug}`);
}
