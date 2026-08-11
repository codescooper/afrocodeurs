import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { notify } from "@/features/notifications/notify";
import { messageSchema } from "@/features/messaging/validators";

export const dynamic = "force-dynamic";

async function membership(conversationId: string, userId: string) {
  return db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } }, select: { id: true } });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!(await membership(id, session.user.id))) return NextResponse.json({ error: "interdit" }, { status: 403 });
  const afterRaw = new URL(request.url).searchParams.get("after");
  const after = afterRaw && !Number.isNaN(Date.parse(afterRaw)) ? new Date(afterRaw) : new Date(0);
  const messages = await db.message.findMany({
    where: { conversationId: id, createdAt: { gt: after } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, body: true, createdAt: true, authorId: true, author: { select: { username: true, name: true, image: true } } },
  });
  await db.conversationMember.update({ where: { conversationId_userId: { conversationId: id, userId: session.user.id } }, data: { lastReadAt: new Date() } });
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isEmailVerified) return NextResponse.json({ error: "Compte vérifié requis." }, { status: 401 });
  const { id } = await params;
  if (!(await membership(id, session.user.id))) return NextResponse.json({ error: "interdit" }, { status: 403 });
  const ip = await clientIp();
  if (!rateLimit(`message:${session.user.id}:${ip}`, 30, 60_000).ok) return NextResponse.json({ error: "Trop de messages. Patientez une minute." }, { status: 429 });
  const parsed = messageSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Message invalide" }, { status: 400 });

  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({ data: { conversationId: id, authorId: session.user.id, body: parsed.data.body }, select: { id: true, body: true, createdAt: true, authorId: true, author: { select: { username: true, name: true, image: true } } } });
    await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
    await tx.conversationMember.update({ where: { conversationId_userId: { conversationId: id, userId: session.user.id } }, data: { lastReadAt: new Date() } });
    return created;
  });
  const recipients = await db.conversationMember.findMany({ where: { conversationId: id, userId: { not: session.user.id } }, select: { userId: true } });
  await Promise.all(recipients.map((recipient) => notify({ userId: recipient.userId, actorId: session.user.id, type: "MESSAGE_NEW", title: `Message de ${session.user.username}`, body: parsed.data.body.slice(0, 120), link: `/messages/${id}` })));
  return NextResponse.json({ message }, { status: 201 });
}
