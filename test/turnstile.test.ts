import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { verifyTurnstile } from "../lib/turnstile";
beforeEach(() => { vi.stubEnv("TURNSTILE_SECRET_KEY", "private-test-secret"); vi.spyOn(console, "warn").mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("rejects a missing token before contacting the provider", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect(await verifyTurnstile(null, "127.0.0.1")).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});
it("verifies with a bounded request and requires boolean success", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }); vi.stubGlobal("fetch", fetch);
  expect(await verifyTurnstile("token", "127.0.0.1")).toBe(true);
  expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: "true" }) });
  expect(await verifyTurnstile("token", "127.0.0.1")).toBe(false);
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("private-test-secret");
});
it.each(["http", "network", "expired", "json"])("fails closed on %s errors", async (mode) => {
  vi.stubGlobal("fetch", mode === "network" ? vi.fn().mockRejectedValue(new Error("timeout")) : vi.fn().mockResolvedValue({
    ok: mode !== "http", status: 503, json: async () => { if (mode === "json") throw new Error("invalid"); return { success: false, "error-codes": ["timeout-or-duplicate"] }; },
  }));
  expect(await verifyTurnstile("token", "127.0.0.1")).toBe(false);
});
