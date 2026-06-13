import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Supprime l'abonnement push du navigateur courant. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (typeof endpoint === "string") {
    await db.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });
  }

  return NextResponse.json({ ok: true });
}
