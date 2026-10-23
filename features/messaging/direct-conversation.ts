import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function ensureDirectConversation(userId: string, recipientId: string) {
  const memberIds = [userId, recipientId].sort();
  const directKey = memberIds.join(":");
  const existing = await db.conversation.findUnique({ where: { directKey }, select: { id: true } });
  if (existing) return existing;
  try {
    return await db.conversation.create({ data: { type: "DIRECT", directKey, members: { create: memberIds.map((id) => ({ userId: id, role: id === userId ? "OWNER" : "MEMBER" })) } }, select: { id: true } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const concurrent = await db.conversation.findUnique({ where: { directKey }, select: { id: true } });
    if (!concurrent) throw error;
    return concurrent;
  }
}
