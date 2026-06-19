import * as Sentry from "@sentry/nextjs";

type ErrorContext = Record<string, unknown>;

/**
 * Capture une erreur applicative.
 *
 * - Envoyée à **Sentry** si configuré (`Sentry.init` est désactivé sans DSN →
 *   l'appel est alors un no-op, aucune donnée ne part).
 * - **Toujours** journalisée (logs serveur Railway / console navigateur), même
 *   sans Sentry. Isomorphe (client + serveur) — pas de `server-only`.
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  Sentry.captureException(error, context ? { extra: context } : undefined);

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
