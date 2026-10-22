import "server-only";
import { db } from "@/lib/db";
export const memberSelect = { id: true, username: true, name: true, image: true } as const;
export async function blockedMentorshipIds(userId?: string) {
  if (!userId) return [];
  const blocks = await db.mentorshipBlock.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } });
  return blocks.map((b) => b.blockerId === userId ? b.blockedId : b.blockerId);
}
