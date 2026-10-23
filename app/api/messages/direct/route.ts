import { NextResponse } from "next/server";
import { z } from "zod";
import { guard } from "@/lib/guard";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { ensureDirectConversation } from "@/features/messaging/direct-conversation";

export async function POST(request: Request) {
  const g = await guard({ verified: true });
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: 401 });
  if (!rateLimit(`chat-direct:${g.user.id}`, 20, 60000).ok) return NextResponse.json({ error: "Trop de demandes. Patientez." }, { status: 429 });
  const parsed = z.object({ recipientId: z.string().min(1).max(150) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.recipientId === g.user.id) return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
  const user = await db.user.findUnique({ where: { id: parsed.data.recipientId }, select: { id: true, username: true, name: true, image: true, emailVerified: true } });
  if (!user?.emailVerified) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
  const conversation = await ensureDirectConversation(g.user.id, user.id);
  return NextResponse.json({ conversation: { id: conversation.id, title: user.name ?? `@${user.username}`, image: user.image, href: `/messages/${conversation.id}`, preview: "", updatedAt: new Date().toISOString(), unread: 0 } });
}
