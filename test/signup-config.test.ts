import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getSignupConfig } from "../lib/signup-config";

it("only returns public runtime configuration, not secrets or frozen build flags", () => {
  const env = { TURNSTILE_SITE_KEY: "public-runtime", TURNSTILE_SECRET_KEY: "private", POW_ENABLED: "true", AUTH_SECRET: "signing", NEXT_PUBLIC_POW_ENABLED: "false" };
  expect(getSignupConfig(env)).toEqual({ turnstileSiteKey: "public-runtime", powEnabled: true });
  expect(JSON.stringify(getSignupConfig(env))).not.toContain("private");
  env.TURNSTILE_SITE_KEY = "changed-at-runtime";
  expect(getSignupConfig(env).turnstileSiteKey).toBe("changed-at-runtime");
});
it("supports the legacy public key name at runtime", () => {
  expect(getSignupConfig({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "legacy", TURNSTILE_SECRET_KEY: "secret" }).turnstileSiteKey).toBe("legacy");
});
it.each([
  { TURNSTILE_SECRET_KEY: "secret" }, { TURNSTILE_SITE_KEY: "public" },
  { POW_ENABLED: "true" }, { POW_ENABLED: "yes" },
])("refuses incomplete or invalid anti-bot configuration: %o", (env) => {
  expect(() => getSignupConfig(env)).toThrow();
});
it("supports explicitly disabled development checks and the legacy signing secret", () => {
  expect(getSignupConfig({})).toEqual({ turnstileSiteKey: null, powEnabled: false });
  expect(getSignupConfig({ POW_ENABLED: "true", NEXTAUTH_SECRET: "signing" }).powEnabled).toBe(true);
});
