import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Active les défis programmés et clôt ceux dont la semaine est terminée. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const authorized = Boolean(secret) && (request.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret);
  if (!authorized) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const now = new Date();
  const [published, closed] = await db.$transaction([
    db.challenge.updateMany({ where: { status: "SCHEDULED", publishAt: { lte: now } }, data: { status: "PUBLISHED", publishedAt: now } }),
    db.challenge.updateMany({ where: { status: "PUBLISHED", closeAt: { lte: now } }, data: { status: "CLOSED" } }),
  ]);
  return NextResponse.json({ published: published.count, closed: closed.count });
}
