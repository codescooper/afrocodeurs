"use server";
import type { EntityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { notify } from "@/features/notifications/notify";
import { recordAudit } from "@/features/audit/log";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED = new Set<EntityType>(["KNOWLEDGE", "PROBLEM", "PROJECT", "EVENT", "OPPORTUNITY", "COMMUNITY_VENTURE"]);
async function owner(type: EntityType, id: string) {
  if (type === "COMMUNITY_VENTURE") return db.communityVenture.findFirst({ where: { id, status: "PUBLISHED" }, select: { ownerId: true, name: true, slug: true } }).then((v) => v && ({ authorId: v.ownerId, title: v.name, href: `/constellation/${v.slug}` }));
  if (type === "KNOWLEDGE") return db.knowledge.findUnique({ where: { id }, select: { authorId: true, title: true } });
  if (type === "PROBLEM") return db.problem.findUnique({ where: { id }, select: { createdById: true, title: true } }).then(x => x && ({ authorId: x.createdById, title: x.title }));
  if (type === "PROJECT") return db.project.findUnique({ where: { id }, select: { createdById: true, name: true } }).then(x => x && ({ authorId: x.createdById, title: x.name }));
  if (type === "EVENT") return db.event.findUnique({ where: { id }, select: { organizerId: true, title: true } }).then(x => x && ({ authorId: x.organizerId, title: x.title }));
  if (type === "OPPORTUNITY") return db.opportunity.findUnique({ where: { id }, select: { authorId: true, title: true } });
  return null;
}
export type EntityCommentState = { error?: string; success?: boolean } | undefined;
export async function addEntityCommentAction(_: EntityCommentState, formData: FormData): Promise<EntityCommentState> {
  const g = await guard({ permission: "content:comment", verified: true }); if (!g.ok) return { error: g.error };
  const targetType = String(formData.get("targetType")) as EntityType, targetId = String(formData.get("targetId") ?? ""), body = String(formData.get("body") ?? "").trim(), returnPath = String(formData.get("returnPath") ?? "/");
  if (!ALLOWED.has(targetType) || !targetId || body.length < 2 || body.length > 3000 || !returnPath.startsWith("/") || returnPath.startsWith("//")) return { error: "Le commentaire doit contenir de 2 à 3 000 caractères et viser un contenu valide." };
  const target = await owner(targetType, targetId); if (!target) return { error: "Ce contenu n’est plus disponible." };
  if (targetType === "COMMUNITY_VENTURE") {
    if (!rateLimit(`venture-comment:${g.user.id}`, 10, 5 * 60 * 1000).ok) return { error: "Trop de commentaires. Patiente quelques minutes." };
    if (!("href" in target) || target.href !== returnPath) return { error: "Cette fiche n’est plus disponible." };
    const blocked = await db.ventureBlock.findFirst({ where: { OR: [{ blockerId: g.user.id, blockedId: target.authorId }, { blockerId: target.authorId, blockedId: g.user.id }] }, select: { id: true } });
    if (blocked) return { error: "Tu ne peux pas commenter cette fiche." };
  }
  const comment = await db.comment.create({ data: { authorId: g.user.id, targetType, targetId, body } });
  await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "COMMENT", entityId: comment.id, after: { body, targetType, targetId } });
  await notify({ userId: target.authorId, actorId: g.user.id, type: "COMMENT", title: "Nouveau commentaire", body: `@${g.user.username} a commenté « ${target.title} ».`, link: returnPath });
  revalidatePath(returnPath);
  return { success: true };
}
