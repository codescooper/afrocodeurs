"use server";
import type { EntityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { notify } from "@/features/notifications/notify";
import { recordAudit } from "@/features/audit/log";

const ALLOWED = new Set<EntityType>(["KNOWLEDGE", "PROBLEM", "PROJECT", "EVENT", "OPPORTUNITY"]);
async function owner(type: EntityType, id: string) {
  if (type === "KNOWLEDGE") return db.knowledge.findUnique({ where: { id }, select: { authorId: true, title: true } });
  if (type === "PROBLEM") return db.problem.findUnique({ where: { id }, select: { createdById: true, title: true } }).then(x => x && ({ authorId: x.createdById, title: x.title }));
  if (type === "PROJECT") return db.project.findUnique({ where: { id }, select: { createdById: true, name: true } }).then(x => x && ({ authorId: x.createdById, title: x.name }));
  if (type === "EVENT") return db.event.findUnique({ where: { id }, select: { organizerId: true, title: true } }).then(x => x && ({ authorId: x.organizerId, title: x.title }));
  if (type === "OPPORTUNITY") return db.opportunity.findUnique({ where: { id }, select: { authorId: true, title: true } });
  return null;
}
export async function addEntityCommentAction(formData: FormData) {
  const g = await guard({ permission: "content:comment", verified: true }); if (!g.ok) return;
  const targetType = String(formData.get("targetType")) as EntityType, targetId = String(formData.get("targetId") ?? ""), body = String(formData.get("body") ?? "").trim(), returnPath = String(formData.get("returnPath") ?? "/");
  if (!ALLOWED.has(targetType) || !targetId || body.length < 2 || body.length > 3000 || !returnPath.startsWith("/")) return;
  const target = await owner(targetType, targetId); if (!target) return;
  const comment = await db.comment.create({ data: { authorId: g.user.id, targetType, targetId, body } });
  await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "COMMENT", entityId: comment.id, after: { body, targetType, targetId } });
  await notify({ userId: target.authorId, actorId: g.user.id, type: "COMMENT", title: "Nouveau commentaire", body: `@${g.user.username} a commenté « ${target.title} ».`, link: returnPath });
  revalidatePath(returnPath);
}
