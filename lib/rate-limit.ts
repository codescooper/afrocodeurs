import "server-only";

import { headers } from "next/headers";

type Result = { ok: boolean; remaining: number; retryAfterSec: number };

const buckets = new Map<string, { count: number; resetAt: number }>();

// Nettoyage paresseux : évite une fuite mémoire si beaucoup de clés.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

/**
 * Limiteur de débit à fenêtre fixe, en mémoire.
 *
 * Suffisant pour un déploiement mono-instance (VPS, conteneur). Pour du
 * serverless multi-instances (Vercel), brancher un store partagé
 * (Upstash/Redis) — cf. docs/DEPLOYMENT.md. L'interface ne changera pas.
 */
export function rateLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
    };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
}

/** IP cliente depuis les en-têtes (proxy-aware). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
