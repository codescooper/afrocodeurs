import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notify } from "@/features/notifications/notify";
import { messageSchema } from "@/features/messaging/validators";

export const dynamic = "force-dynamic";
const messageSelect = { id: true, body: true, createdAt: true, authorId: true, author: { select: { username: true, name: true, image: true } } } as const;

async function access(conversationId: string, userId: string) {
  const conversation = await db.conversation.findUnique({ where: { id: conversationId }, select: { type: true } });
  if (!conversation) return null;
  if (conversation.type === "GLOBAL") return { type: conversation.type, membershipId: null };
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { id: true } });
  return member ? { type: conversation.type, membershipId: member.id } : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const { id } = await params;
  const allowed = await access(id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "interdit" }, { status: 403 });
  const afterRaw = new URL(request.url).searchParams.get("after");
  const hasAfter = Boolean(afterRaw && !Number.isNaN(Date.parse(afterRaw)) && Date.parse(afterRaw!) > 0);
  const found = await db.message.findMany({
    where: { conversationId: id, deletedAt: null, ...(hasAfter ? { createdAt: { gt: new Date(afterRaw!) } } : {}) },
    orderBy: { createdAt: hasAfter ? "asc" : "desc" },
    take: 100,
    select: messageSelect,
  });
  if (allowed.membershipId) await db.conversationMember.update({ where: { id: allowed.membershipId }, data: { lastReadAt: new Date() } });
  return NextResponse.json({ messages: hasAfter ? found : found.reverse() });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isEmailVerified) return NextResponse.json({ error: "Compte vérifié requis." }, { status: 401 });
  const { id } = await params;
  const allowed = await access(id, session.user.id);
  if (!allowed) return NextResponse.json({ error: "interdit" }, { status: 403 });
  const ip = await clientIp();
  if (!rateLimit(`message:${session.user.id}:${ip}`, 30, 60_000).ok) return NextResponse.json({ error: "Trop de messages. Patientez une minute." }, { status: 429 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Message invalide" }, { status: 400 });

  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({ data: { conversationId: id, authorId: session.user.id, body: parsed.data.body }, select: messageSelect });
    await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
    if (allowed.membershipId) await tx.conversationMember.update({ where: { id: allowed.membershipId }, data: { lastReadAt: new Date() } });
    return created;
  });
  if (allowed.type !== "GLOBAL") {
    const recipients = await db.conversationMember.findMany({ where: { conversationId: id, userId: { not: session.user.id } }, select: { userId: true } });
    await Promise.all(recipients.map((recipient) => notify({ userId: recipient.userId, actorId: session.user.id, type: "MESSAGE_NEW", title: `Message de ${session.user.username}`, body: parsed.data.body.slice(0, 120), link: `/messages/${id}` })));
  }
  return NextResponse.json({ message }, { status: 201 });
}
