import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_PUSH_SUBSCRIPTIONS, pushSubscriptionSchema, readPushJson, resolvePushAddress } from "@/features/notifications/push-policy";

/** Enregistre (ou met à jour) l'abonnement push du navigateur courant. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!rateLimit(`push-subscribe:${session.user.id}`, 10, 60_000).ok) {
    return NextResponse.json({ error: "Trop de demandes. Réessaie dans une minute." }, { status: 429 });
  }
  const parsed = pushSubscriptionSchema.safeParse(await readPushJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { endpoint, keys: { p256dh, auth: authKey } } = parsed.data;
  try { await resolvePushAddress(endpoint); }
  catch { return NextResponse.json({ error: "Service push indisponible ou non autorisé." }, { status: 400 }); }

  let status: number;
  try { status = await db.$transaction(async tx => {
    // Serialize device-count checks for this account, even across instances.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`;
    const existing = await tx.pushSubscription.findUnique({ where: { endpoint } });
    if (existing && existing.userId !== session.user.id) return 409;
    if (!existing && await tx.pushSubscription.count({ where: { userId: session.user.id } }) >= MAX_PUSH_SUBSCRIPTIONS) return 409;
    if (existing) await tx.pushSubscription.update({ where: { id: existing.id, userId: session.user.id }, data: { p256dh, auth: authKey } });
    else await tx.pushSubscription.create({ data: { userId: session.user.id, endpoint, p256dh, auth: authKey } });
    return 200;
  }); } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    status = 409;
  }
  if (status !== 200) return NextResponse.json({ error: "Cet abonnement est déjà associé à un autre compte ou la limite de cinq appareils est atteinte." }, { status });

  return NextResponse.json({ ok: true });
}
