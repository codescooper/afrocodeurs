type ErrorContext = Record<string, unknown>;

/**
 * Capture une erreur applicative.
 *
 * Aujourd'hui : log structuré (visible dans les logs serveur en prod et dans
 * la console navigateur). Isomorphe (client + serveur) — pas de `server-only`.
 *
 * Prêt pour Sentry : l'activation se fait par config env (cf. docs/DEPLOYMENT.md),
 * sans changer les appelants — on garde le module dépendance-free tant qu'aucune
 * clé n'est fournie.
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  try {
    const payload = {
      level: "error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    };
    console.error("[capture]", JSON.stringify(payload));
  } catch {
    console.error("[capture]", error, context);
  }
}
