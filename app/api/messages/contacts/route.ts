import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CHAT_ACTIVE_MS, chatOnline } from "@/features/messaging/presence";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim().replace(/^@/, "").slice(0, 40) ?? "";
  const offset = Math.min(10000, Math.max(0, Number.parseInt(params.get("offset") ?? "0", 10) || 0));
  const now = Date.now();
  const cutoff = new Date(now - CHAT_ACTIVE_MS);
  const where = { id: { not: session.user.id }, emailVerified: { not: null }, ...(q ? { OR: [{ username: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] } : {}) };
  const select = { id: true, username: true, name: true, image: true, chatPresence: { select: { lastSeen: true } } } as const;
  const online = offset === 0 ? await db.user.findMany({ where: { ...where, chatPresence: { is: { lastSeen: { gte: cutoff } } } }, select, orderBy: { username: "asc" }, take: 101 }) : [];
  const offline = await db.user.findMany({ where: { AND: [where, { OR: [{ chatPresence: { is: null } }, { chatPresence: { is: { lastSeen: { lt: cutoff } } } }] }] }, select, orderBy: { username: "asc" }, skip: offset, take: 31 });
  const contact = (user: (typeof offline)[number]) => ({ id: user.id, username: user.username, name: user.name, image: user.image, online: chatOnline(user.chatPresence?.lastSeen, now) });
  return NextResponse.json({ online: online.slice(0, 100).map(contact), offline: offline.slice(0, 30).map(contact), nextOffset: offline.length > 30 ? offset + 30 : null, moreOnline: online.length > 100 }, { headers: { "Cache-Control": "private, no-store" } });
}
