import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notify } from "@/features/notifications/notify";
import { messageSchema } from "@/features/messaging/validators";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";
const messageSelect = { id: true, body: true, createdAt: true, authorId: true, author: { select: { username: true, name: true, image: true } } } as const;

async function access(conversationId: string, userId: string) {
  const conversation = await db.conversation.findUnique({ where: { id: conversationId }, select: { type: true, communityId: true } });
  if (!conversation) return null;
  if (conversation.type === "GLOBAL") return { type: conversation.type, membershipId: null, communityMembershipId: null, communityId: null, communityRole: null, chatMutedUntil: null };
  if (conversation.communityId) {
    const member = await db.communityMember.findUnique({ where: { userId_communityId: { userId, communityId: conversation.communityId } }, select: { id: true, role: true, chatMutedUntil: true } });
    return member ? { type: conversation.type, membershipId: null, communityMembershipId: member.id, communityId: conversation.communityId, communityRole: member.role, chatMutedUntil: member.chatMutedUntil } : null;
  }
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { id: true } });
  return member ? { type: conversation.type, membershipId: member.id, communityMembershipId: null, communityId: null, communityRole: null, chatMutedUntil: null } : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const { id } = await params;
  const allowed = await access(id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "interdit" }, { status: 403 });
  const afterRaw = new URL(request.url).searchParams.get("after");
  const beforeRaw = new URL(request.url).searchParams.get("before");
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100);
  const hasAfter = Boolean(afterRaw && !Number.isNaN(Date.parse(afterRaw)) && Date.parse(afterRaw!) > 0);
  const hasBefore = Boolean(beforeRaw && !Number.isNaN(Date.parse(beforeRaw)) && Date.parse(beforeRaw!) > 0);
  const found = await db.message.findMany({
    where: { conversationId: id, deletedAt: null, ...(query ? { body: { contains: query, mode: "insensitive" } } : hasAfter ? { createdAt: { gt: new Date(afterRaw!) } } : hasBefore ? { createdAt: { lt: new Date(beforeRaw!) } } : {}) },
    orderBy: { createdAt: hasAfter ? "asc" : "desc" },
    take: hasAfter ? 100 : 101,
    select: messageSelect,
  });
  if (allowed.membershipId) await db.conversationMember.update({ where: { id: allowed.membershipId }, data: { lastReadAt: new Date() } });
  if (allowed.communityMembershipId) await db.communityMember.update({ where: { id: allowed.communityMembershipId }, data: { chatLastReadAt: new Date() } });
  const hasMore = !hasAfter && found.length > 100;
  const page = hasMore ? found.slice(0, 100) : found;
  return NextResponse.json({ messages: hasAfter ? page : page.reverse(), hasMore });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isEmailVerified) return NextResponse.json({ error: "Compte vérifié requis." }, { status: 401 });
  const { id } = await params;
  const allowed = await access(id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "interdit" }, { status: 403 });
  if (allowed.chatMutedUntil && allowed.chatMutedUntil > new Date()) return NextResponse.json({ error: "Votre participation au salon est temporairement suspendue." }, { status: 403 });
  const ip = await clientIp();
  if (!rateLimit(`message:${session.user.id}:${ip}`, 30, 60_000).ok) return NextResponse.json({ error: "Trop de messages. Patientez une minute." }, { status: 429 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Message invalide" }, { status: 400 });

  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({ data: { conversationId: id, authorId: session.user.id, body: parsed.data.body }, select: messageSelect });
    await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
    if (allowed.membershipId) await tx.conversationMember.update({ where: { id: allowed.membershipId }, data: { lastReadAt: new Date() } });
    if (allowed.communityMembershipId) await tx.communityMember.update({ where: { id: allowed.communityMembershipId }, data: { chatLastReadAt: new Date() } });
    return created;
  });
  if (allowed.type !== "GLOBAL" && !allowed.communityId) {
    const recipients = await db.conversationMember.findMany({ where: { conversationId: id, userId: { not: session.user.id } }, select: { userId: true } });
    await Promise.all(recipients.map((recipient) => notify({ userId: recipient.userId, actorId: session.user.id, type: "MESSAGE_NEW", title: `Message de ${session.user.username}`, body: parsed.data.body.slice(0, 120), link: `/messages/${id}` })));
  }
  return NextResponse.json({ message }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const { id } = await params;
  const allowed = await access(id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "interdit" }, { status: 403 });
  const body = await request.json().catch(() => null) as { messageId?: unknown } | null;
  if (!body || typeof body.messageId !== "string") return NextResponse.json({ error: "message invalide" }, { status: 400 });

  const message = await db.message.findFirst({ where: { id: body.messageId, conversationId: id, deletedAt: null }, select: { id: true, authorId: true, body: true } });
  if (!message) return NextResponse.json({ ok: true });

  let moderator = can(session.user.role, "forum:moderate");
  if (!moderator && allowed.communityId) {
    const membership = await db.communityMember.findUnique({ where: { userId_communityId: { userId: session.user.id, communityId: allowed.communityId } }, select: { role: true } });
    moderator = membership?.role === "ADMIN" || membership?.role === "MODERATOR";
  }
  if (message.authorId !== session.user.id && !moderator) return NextResponse.json({ error: "interdit" }, { status: 403 });

  await db.$transaction([
    db.message.update({ where: { id: message.id }, data: { deletedAt: new Date() } }),
    db.auditLog.create({ data: { actorId: session.user.id, action: "DELETE", entityType: "MESSAGE", entityId: message.id, before: { body: message.body, conversationId: id } } }),
  ]);
  return NextResponse.json({ ok: true });
}
