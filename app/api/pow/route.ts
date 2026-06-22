import { NextResponse } from "next/server";

import { issueChallenge, powEnabled } from "@/lib/pow";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs"; // node:crypto
export const dynamic = "force-dynamic"; // un challenge frais à chaque requête, jamais en cache

/**
 * Émet un challenge de preuve de travail (Hashcash). Lu par le widget client
 * avant l'envoi d'un formulaire sensible. Sans état : la signature du challenge
 * suffit à le vérifier plus tard (cf. `lib/pow.ts`).
 */
export async function GET() {
  if (!powEnabled()) {
    // PoW désactivé (dev) — le client n'a rien à calculer.
    return NextResponse.json({ enabled: false });
  }

  const ip = await clientIp();
  if (!rateLimit(`pow:${ip}`, 60, 60 * 1000).ok) {
    return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });
  }

  const { challenge, difficulty, expiresAt } = issueChallenge();
  return NextResponse.json({ enabled: true, challenge, difficulty, expiresAt });
}
