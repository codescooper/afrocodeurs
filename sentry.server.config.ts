// Initialisation Sentry — runtime Node.js. Chargée par `register()` dans
// instrumentation.ts au démarrage du serveur. No-op sans DSN : l'intégration
// reste invisible en dev et tant qu'aucune clé n'est fournie.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment:
    process.env.SENTRY_ENVIRONMENT ??
    process.env.RAILWAY_ENVIRONMENT_NAME ??
    process.env.NODE_ENV,
  // Erreurs uniquement pour l'instant (pas de tracing de performance).
  tracesSampleRate: 0,
});
