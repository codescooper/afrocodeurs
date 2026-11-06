import "server-only";

export type SignupConfig = { turnstileSiteKey: string | null; powEnabled: boolean };

/** Read runtime values on the server, never frozen NEXT_PUBLIC values in a widget. */
export function getSignupConfig(env: Readonly<Record<string, string | undefined>> = process.env): SignupConfig {
  const siteKey = env.TURNSTILE_SITE_KEY?.trim() || env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
  const hasCaptchaSecret = Boolean(env.TURNSTILE_SECRET_KEY?.trim());
  if (Boolean(siteKey) !== hasCaptchaSecret) throw new Error("TURNSTILE_CONFIGURATION_INCOMPLETE");
  if (env.POW_ENABLED && !["true", "false"].includes(env.POW_ENABLED)) throw new Error("POW_CONFIGURATION_INVALID");
  const powEnabled = env.POW_ENABLED === "true";
  if (powEnabled && !(env.AUTH_SECRET || env.NEXTAUTH_SECRET)) throw new Error("POW_SIGNING_SECRET_MISSING");
  return { turnstileSiteKey: siteKey, powEnabled };
}
