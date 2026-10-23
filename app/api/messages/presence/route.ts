import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Requête invalide." }, { status: 415 });
  if (!rateLimit(`chat-presence:${session.user.id}`, 6, 60000).ok) return NextResponse.json({ error: "Patientez." }, { status: 429 });
  const now = new Date();
  await db.chatPresence.upsert({ where: { userId: session.user.id }, create: { userId: session.user.id, lastSeen: now }, update: { lastSeen: now } });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
