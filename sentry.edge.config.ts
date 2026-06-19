// Initialisation Sentry — runtime Edge (proxy / routes edge). Chargée par
// `register()` dans instrumentation.ts. No-op sans DSN.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment:
    process.env.SENTRY_ENVIRONMENT ??
    process.env.RAILWAY_ENVIRONMENT_NAME ??
    process.env.NODE_ENV,
  tracesSampleRate: 0,
});
