import { NextResponse } from "next/server";
import { syncAllToMeilisearch } from "@/lib/meilisearch-sync";

export const dynamic = "force-dynamic";

/**
 * Déclenche la ré-indexation complète des données vers Meilisearch.
 * Protégé par `CRON_SECRET` via `Authorization: Bearer <secret>` ou `?key=<secret>`.
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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await syncAllToMeilisearch();
  if (!result.success) {
    return NextResponse.json({ error: result.error, counts: result.counts }, { status: 500 });
  }

  return NextResponse.json({ message: "Indexation Meilisearch réussie", counts: result.counts });
}
