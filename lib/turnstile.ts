import "server-only";

/**
 * Vérifie un token Cloudflare Turnstile (CAPTCHA).
 *
 * Si `TURNSTILE_SECRET_KEY` n'est pas défini → pas de vérification (mode dev),
 * on renvoie `true`. En production, définis la clé pour activer la protection.
 */
export async function verifyTurnstile(
  token: string | null,
  ip?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // pas de CAPTCHA configuré (dev)
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token, remoteip: ip }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
