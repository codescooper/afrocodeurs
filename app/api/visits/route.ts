import { createHash, randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const VISITOR_COOKIE = "afrocodeurs-visitor";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function dailyHash(token: string) {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${token}:${day}`).digest("hex");
}

async function totalVisits() {
  return db.dailyVisit.count();
}

export async function GET() {
  return NextResponse.json(
    { total: await totalVisits() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(VISITOR_COOKIE)?.value;
  const token = existingToken ?? randomUUID();
  const visitorDayHash = dailyHash(token);

  await db.dailyVisit.upsert({
    where: { visitorDayHash },
    create: { visitorDayHash },
    update: {},
  });

  const response = NextResponse.json({ total: await totalVisits() });
  if (!existingToken) {
    response.cookies.set(VISITOR_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return response;
}
