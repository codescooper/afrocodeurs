// Instrumentation côté navigateur — exécutée après le chargement du HTML et
// avant l'hydratation React (cf. instrumentation-client.md). Init Sentry client,
// no-op sans NEXT_PUBLIC_SENTRY_DSN.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
});

// Relie les transitions de navigation App Router à Sentry.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
