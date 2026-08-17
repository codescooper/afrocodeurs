"use server";

import type { EntityType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { hasRank } from "@/lib/permissions";
import { recordAudit } from "@/features/audit/log";

export type ContentMutationState = { error?: string } | undefined;
type EditableType = Extract<EntityType, "QUESTION" | "ANSWER" | "COMMENT" | "KNOWLEDGE" | "PROBLEM">;

const mutationSchema = z.object({
  entityType: z.enum(["QUESTION", "ANSWER", "COMMENT", "KNOWLEDGE", "PROBLEM"]),
  entityId: z.string().min(1),
  title: z.string().trim().min(5).max(180).optional(),
  body: z.string().trim().min(2).max(50000),
  returnPath: z.string().startsWith("/").max(500),
});

function mayMutate(actorId: string, role: UserRole, authorId: string) {
  return actorId === authorId || hasRank(role, "MODERATOR");
}

async function loadEditable(type: EditableType, id: string) {
  if (type === "QUESTION") return db.question.findUnique({ where: { id }, select: { id: true, authorId: true, title: true, body: true } });
  if (type === "ANSWER") return db.answer.findUnique({ where: { id }, select: { id: true, authorId: true, body: true } });
  if (type === "COMMENT") return db.comment.findUnique({ where: { id }, select: { id: true, authorId: true, body: true } });
  if (type === "KNOWLEDGE") return db.knowledge.findUnique({ where: { id }, select: { id: true, authorId: true, title: true, content: true } });
  return db.problem.findUnique({ where: { id }, select: { id: true, createdById: true, title: true, description: true } });
}

export async function updateUserContentAction(
  _previous: ContentMutationState,
  formData: FormData,
): Promise<ContentMutationState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = mutationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Contenu invalide." };

  const { entityType, entityId, title, body, returnPath } = parsed.data;
  const current = await loadEditable(entityType, entityId);
  if (!current) return { error: "Contenu introuvable." };
  const authorId = "createdById" in current ? current.createdById : current.authorId;
  if (!mayMutate(g.user.id, g.user.role, authorId)) return { error: "Action non autorisée." };

  let after: Record<string, string>;
  if (entityType === "QUESTION") {
    if (!title) return { error: "Le titre est requis." };
    after = { title, body };
    await db.question.update({ where: { id: entityId }, data: after });
  } else if (entityType === "ANSWER") {
    after = { body };
    await db.answer.update({ where: { id: entityId }, data: after });
  } else if (entityType === "COMMENT") {
    after = { body };
    await db.comment.update({ where: { id: entityId }, data: after });
  } else if (entityType === "KNOWLEDGE") {
    if (!title) return { error: "Le titre est requis." };
    after = { title, content: body };
    await db.knowledge.update({ where: { id: entityId }, data: after });
  } else {
    if (!title) return { error: "Le titre est requis." };
    after = { title, description: body };
    await db.problem.update({ where: { id: entityId }, data: after });
  }

  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType, entityId, before: current, after });
  revalidatePath(returnPath);
  return undefined;
}

export async function deleteUserContentAction(formData: FormData): Promise<void> {
  const g = await guard({ verified: true });
  if (!g.ok) return;
  const entityType = formData.get("entityType") as EditableType;
  const entityId = formData.get("entityId");
  const returnPath = formData.get("returnPath");
  if (!(["QUESTION", "ANSWER", "COMMENT", "KNOWLEDGE", "PROBLEM"] as string[]).includes(entityType) || typeof entityId !== "string" || typeof returnPath !== "string" || !returnPath.startsWith("/")) return;

  const current = await loadEditable(entityType, entityId);
  if (!current) return;
  const authorId = "createdById" in current ? current.createdById : current.authorId;
  if (!mayMutate(g.user.id, g.user.role, authorId)) return;

  await recordAudit({ actorId: g.user.id, action: "DELETE", entityType, entityId, before: current });
  if (entityType === "QUESTION") {
    const answers = await db.answer.findMany({ where: { questionId: entityId }, select: { id: true } });
    const targetIds = [entityId, ...answers.map((answer) => answer.id)];
    await db.$transaction([
      db.comment.deleteMany({ where: { OR: targetIds.map((targetId) => ({ targetId })) } }),
      db.vote.deleteMany({ where: { OR: targetIds.map((targetId) => ({ targetId })) } }),
      db.question.delete({ where: { id: entityId } }),
    ]);
  }
  else if (entityType === "ANSWER") {
    await db.$transaction([
      db.comment.deleteMany({ where: { targetId: entityId } }),
      db.vote.deleteMany({ where: { targetId: entityId } }),
      db.answer.delete({ where: { id: entityId } }),
    ]);
  }
  else if (entityType === "COMMENT") await db.comment.delete({ where: { id: entityId } });
  else if (entityType === "KNOWLEDGE") await db.knowledge.delete({ where: { id: entityId } });
  else await db.problem.delete({ where: { id: entityId } });

  revalidatePath(returnPath);
  if (entityType === "QUESTION") redirect("/forum");
  if (entityType === "KNOWLEDGE") redirect("/knowledge");
  if (entityType === "PROBLEM") redirect("/explorer");
}
