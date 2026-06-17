import { NextResponse } from "next/server";

import { syncAllProjects } from "@/features/projects/sync";

export const dynamic = "force-dynamic";

/**
 * Synchronise toutes les roadmaps avec leurs dépôts GitHub. À déclencher par un
 * planificateur (cron Railway ou externe) avec `Authorization: Bearer <CRON_SECRET>`
 * ou `?key=<CRON_SECRET>`. Même protocole que `/api/cron/digest`.
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

  const synced = await syncAllProjects();
  return NextResponse.json({ synced });
}
