import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { $queryRaw: vi.fn().mockResolvedValue([{ value: 1 }]) } }));
import { GET } from "../app/api/health/route";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it("marks a deployment unhealthy when signup cannot render its mandatory captcha", async () => {
  vi.stubEnv("TURNSTILE_SECRET_KEY", "secret"); vi.stubEnv("TURNSTILE_SITE_KEY", ""); vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
  const response = await GET();
  expect(response.status).toBe(503); expect(await response.json()).toEqual({ status: "degraded", signup: "unavailable" });
});
it("accepts a complete runtime configuration", async () => {
  vi.stubEnv("TURNSTILE_SECRET_KEY", "secret"); vi.stubEnv("TURNSTILE_SITE_KEY", "public"); vi.stubEnv("POW_ENABLED", "false");
  expect((await GET()).status).toBe(200);
});
