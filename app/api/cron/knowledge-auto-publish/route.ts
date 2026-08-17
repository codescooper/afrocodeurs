import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { notify } from "@/features/notifications/notify";

export const dynamic = "force-dynamic";

const REVIEW_DELAY_MS = 24 * 60 * 60 * 1000;

/** Publie avec un badge non vérifié les ressources restées 24 h sans décision. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const authorized =
    Boolean(secret) &&
    (request.headers.get("authorization") === `Bearer ${secret}` ||
      url.searchParams.get("key") === secret);

  if (!authorized) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const threshold = new Date(now.getTime() - REVIEW_DELAY_MS);
  const eligible = await db.knowledge.findMany({
    where: { status: "SUBMITTED", updatedAt: { lte: threshold } },
    select: { id: true, slug: true, title: true, authorId: true },
    take: 200,
  });

  let published = 0;
  for (const item of eligible) {
    const result = await db.knowledge.updateMany({
      where: { id: item.id, status: "SUBMITTED" },
      data: { status: "PUBLISHED", publishedAt: now, lastVerifiedAt: null },
    });
    if (result.count === 0) continue;

    published += 1;
    await notify({
      userId: item.authorId,
      type: "KNOWLEDGE_AUTO_PUBLISHED",
      title: "Ta ressource est maintenant publique",
      body: `« ${item.title} » a été publiée après 24 h avec le badge Non vérifié. Elle pourra encore être vérifiée par l’équipe.`,
      link: `/knowledge/${item.slug}`,
    });
  }

  return NextResponse.json({ eligible: eligible.length, published });
}
