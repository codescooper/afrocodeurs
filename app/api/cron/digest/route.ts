import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { buildDigest } from "@/features/digest/build";

export const dynamic = "force-dynamic";

/**
 * Envoie le digest hebdomadaire. À déclencher par un planificateur (cron Railway
 * ou externe) avec `Authorization: Bearer <CRON_SECRET>` ou `?key=<CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const authorized =
    request.headers.get("authorization") === `Bearer ${secret}` ||
    url.searchParams.get("key") === secret;
  if (!authorized) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const users = await db.user.findMany({
    where: {
      emailVerified: { not: null },
      NOT: { notificationOptOut: { has: "DIGEST" } },
    },
    select: { id: true, email: true, name: true },
    take: 2000,
  });

  let sent = 0;
  for (const user of users) {
    const digest = await buildDigest(user, since);
    if (!digest) continue;
    await sendEmail({
      to: user.email,
      subject: digest.subject,
      html: digest.html,
      text: digest.text,
    });
    sent += 1;
  }

  return NextResponse.json({ eligible: users.length, sent });
}
