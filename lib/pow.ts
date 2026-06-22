import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Anti-bot par preuve de travail — Hashcash (Adam Back, 1997).
 *
 * Asymétrie : *produire* la preuve coûte du CPU au client (~2^difficulty essais),
 * la *vérifier* ne coûte qu'un seul hash au serveur. Un humain paie ~1 s une fois ;
 * un robot qui spamme paie ce coût × le volume → l'abus de masse devient ruineux.
 *
 * Pluggable comme le CAPTCHA Turnstile : sans `POW_ENABLED="true"` (+ un secret
 * disponible), la vérification renvoie `ok` (no-op en dev). On l'active en prod
 * par variable d'environnement, sans changer le code.
 */

const DEFAULT_DIFFICULTY = 18; // bits de zéro en tête (~250 ms navigateur)
const MIN_DIFFICULTY = 12; // plancher : refuse tout challenge en dessous (anti-downgrade)
const MAX_DIFFICULTY = 32;
const TTL_MS = 5 * 60 * 1000; // un challenge est valable 5 minutes

function clampDifficulty(d: number): number {
  if (!Number.isFinite(d)) return DEFAULT_DIFFICULTY;
  return Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, Math.floor(d)));
}

/** Difficulté de production (réglable via `POW_DIFFICULTY`). */
export const POW_DIFFICULTY = clampDifficulty(
  Number(process.env.POW_DIFFICULTY) || DEFAULT_DIFFICULTY,
);

/** Secret de signature — réutilise celui d'Auth.js, rien de neuf à gérer. */
function secret(): string | undefined {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}

/** Le PoW n'agit que s'il est explicitement activé ET qu'un secret existe. */
export function powEnabled(): boolean {
  return process.env.POW_ENABLED === "true" && Boolean(secret());
}

function sign(payload: string): string {
  return createHmac("sha256", secret() as string).update(payload).digest("hex");
}

/** Nombre de bits de zéro en tête d'un condensat (octets). */
export function leadingZeroBits(bytes: Uint8Array): number {
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    if (b === 0) {
      bits += 8;
      continue;
    }
    bits += Math.clz32(b) - 24; // clz32 d'un octet : 24 bits de padding à retrancher
    break;
  }
  return bits;
}

export type Challenge = {
  challenge: string; // "salt:exp:difficulty:sig"
  difficulty: number;
  expiresAt: number;
};

/**
 * Émet un challenge signé, **sans état** : la signature HMAC prouve plus tard
 * qu'il vient bien de nous, donc inutile de le stocker. La difficulté est
 * incluse dans la signature → impossible de l'abaisser (downgrade) côté client.
 */
export function issueChallenge(difficulty = POW_DIFFICULTY): Challenge {
  const d = clampDifficulty(difficulty);
  const salt = randomBytes(16).toString("hex");
  const exp = Date.now() + TTL_MS;
  const payload = `${salt}:${exp}:${d}`;
  return { challenge: `${payload}:${sign(payload)}`, difficulty: d, expiresAt: exp };
}

// Anti-rejeu : un `salt` n'est accepté qu'une seule fois (jusqu'à expiration).
// En mémoire → suffisant en mono-instance ; en serverless multi-instances,
// brancher un store partagé (Redis SETNX). L'interface ne changera pas.
const consumed = new Map<string, number>();
function sweepConsumed(now: number) {
  if (consumed.size < 10000) return;
  for (const [salt, exp] of consumed) if (exp <= now) consumed.delete(salt);
}

export type PowResult = { ok: true } | { ok: false; reason: string };

/**
 * Vérifie une preuve. **O(1).** Renvoie `ok` (no-op) quand le PoW est désactivé.
 * Passe `markConsumed: false` pour une vérification à blanc (démo) qui ne brûle
 * pas le challenge.
 */
export function verifyPoW(
  challenge: string | null | undefined,
  nonce: string | null | undefined,
  opts: { markConsumed?: boolean } = {},
): PowResult {
  if (!powEnabled()) return { ok: true }; // dev / non activé
  if (!challenge || nonce == null || nonce === "") {
    return { ok: false, reason: "preuve manquante" };
  }

  const parts = challenge.split(":");
  if (parts.length !== 4) return { ok: false, reason: "challenge malformé" };
  const [salt, expStr, dStr, sig] = parts as [string, string, string, string];
  const exp = Number(expStr);
  const difficulty = Number(dStr);
  if (!Number.isFinite(exp) || !Number.isFinite(difficulty)) {
    return { ok: false, reason: "challenge malformé" };
  }

  // (a) signature — le challenge vient-il vraiment de nous ? (comparaison constante)
  if (!safeEqualHex(sig, sign(`${salt}:${exp}:${difficulty}`))) {
    return { ok: false, reason: "signature invalide" };
  }
  // (b) fraîcheur
  const now = Date.now();
  if (exp < now) return { ok: false, reason: "challenge expiré" };
  // (c) anti-downgrade
  if (difficulty < MIN_DIFFICULTY) return { ok: false, reason: "difficulté trop faible" };
  // (d) la preuve de travail elle-même
  const digest = createHash("sha256").update(`${challenge}:${nonce}`).digest();
  if (leadingZeroBits(digest) < difficulty) {
    return { ok: false, reason: "preuve insuffisante" };
  }
  // (e) anti-rejeu
  sweepConsumed(now);
  if (consumed.has(salt)) return { ok: false, reason: "preuve déjà utilisée" };
  if (opts.markConsumed !== false) consumed.set(salt, exp);

  return { ok: true };
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Résout un challenge par force brute (le même travail que le navigateur fait
 * dans le Web Worker). Sert aux tests et à une démo serveur ; jamais sur le
 * chemin d'une requête en prod.
 */
export function solveChallenge(challenge: string): number {
  const difficulty = Number(challenge.split(":")[2]);
  for (let nonce = 0; ; nonce++) {
    const digest = createHash("sha256").update(`${challenge}:${nonce}`).digest();
    if (leadingZeroBits(digest) >= difficulty) return nonce;
  }
}
