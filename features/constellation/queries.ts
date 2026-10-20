import "server-only";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hasRank } from "@/lib/permissions";
import { notFound } from "next/navigation";
export const publicMember = { id: true, name: true, username: true, image: true } as const;
export async function ventureBlockedIds(userId?: string) {
  if (!userId) return [];
  const rows = await db.ventureBlock.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } });
  return rows.map((r) => r.blockerId === userId ? r.blockedId : r.blockerId);
}
export async function ventureDetail(slug: string) {
  const session = await auth();
  const venture = await db.communityVenture.findUnique({ where: { slug }, include: { owner: { select: publicMember }, openSourceProject: { select: { name: true, slug: true } } } });
  if (!venture) notFound();
  const owner = session?.user?.id === venture.ownerId;
  const staff = session?.user ? hasRank(session.user.role, "MODERATOR") : false;
  if (!owner && !staff && venture.status !== "PUBLISHED") notFound();
  if (!owner && !staff && (await ventureBlockedIds(session?.user?.id)).includes(venture.ownerId)) notFound();
  const collaboration = session?.user ? await db.ventureCollaboration.findUnique({ where: { ventureId_applicantId: { ventureId: venture.id, applicantId: session.user.id } }, select: { status: true } }) : null;
  return { venture, session, owner, collaboration };
}
