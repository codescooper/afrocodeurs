import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSignupConfig } from "@/lib/signup-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getSignupConfig();
  } catch {
    console.error("[health] signup configuration unavailable");
    return NextResponse.json({ status: "degraded", signup: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[health] database unavailable", error);
    return NextResponse.json(
      { status: "degraded", database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
