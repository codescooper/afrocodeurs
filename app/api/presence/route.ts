import { createHash, randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

const VISITOR_COOKIE = "afrocodeurs-presence";
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const coordinatesSchema = z.object({
  latitude: z.number().min(-37).max(38),
  longitude: z.number().min(-20).max(52),
});

function coarseCoordinate(value: number) {
  return Math.round(value * 2) / 2;
}

function visitorKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const parsed = coordinatesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Position invalide." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(VISITOR_COOKIE)?.value;
  const token = existingToken ?? randomUUID();
  const key = visitorKey(token);

  await db.presencePoint.upsert({
    where: { visitorKey: key },
    create: {
      visitorKey: key,
      latitude: coarseCoordinate(parsed.data.latitude),
      longitude: coarseCoordinate(parsed.data.longitude),
    },
    update: {
      latitude: coarseCoordinate(parsed.data.latitude),
      longitude: coarseCoordinate(parsed.data.longitude),
    },
  });

  const response = NextResponse.json({ ok: true });
  if (!existingToken) {
    response.cookies.set(VISITOR_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: HISTORY_WINDOW_MS / 1000,
    });
  }
  return response;
}

export async function GET() {
  const now = Date.now();
  const points = await db.presencePoint.findMany({
    where: { lastSeen: { gte: new Date(now - HISTORY_WINDOW_MS) } },
    select: { latitude: true, longitude: true, lastSeen: true },
  });
  const grouped = new Map<string, { latitude: number; longitude: number; active: number; previous: number }>();

  for (const point of points) {
    const key = `${point.latitude}:${point.longitude}`;
    const group = grouped.get(key) ?? { latitude: point.latitude, longitude: point.longitude, active: 0, previous: 0 };
    if (point.lastSeen.getTime() >= now - ACTIVE_WINDOW_MS) group.active += 1;
    else group.previous += 1;
    grouped.set(key, group);
  }

  return NextResponse.json(
    { points: [...grouped.values()] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
