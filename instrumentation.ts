import * as Sentry from "@sentry/nextjs";

/**
 * Hook d'instrumentation Next.js — exécuté une fois au démarrage de chaque
 * instance serveur (cf. node_modules/next/dist/docs/.../instrumentation.md).
 * Charge l'init Sentry adaptée au runtime courant.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture les erreurs serveur (rendu RSC, route handlers, server actions).
export const onRequestError = Sentry.captureRequestError;
