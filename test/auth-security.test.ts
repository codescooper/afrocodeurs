import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";

const m = vi.hoisted(() => ({ configure: vi.fn(), find: vi.fn(), raw: vi.fn(), compare: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: m.find }, $queryRaw: m.raw, $executeRaw: vi.fn(async () => 0) } }));
vi.mock("bcryptjs", () => ({ default: { compare: m.compare } }));
vi.mock("next-auth", () => ({ default: (config: NextAuthConfig) => {
  m.configure(config); return { auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() };
} }));
let config: NextAuthConfig;
type Authorize = (credentials: Record<string, string>, request: Request) => Promise<unknown>;
let authorize: Authorize;
const user = { id: "u", email: "u@example.test", username: "user", role: "USER", passwordHash: "hash", emailVerified: new Date(), sessionVersion: 0 };
beforeAll(async () => {
  await import("../lib/auth"); config = m.configure.mock.calls[0][0];
  const provider = config.providers.find(p => typeof p !== "function" && p.id === "credentials") as unknown as { options: { authorize: Authorize } };
  authorize = provider.options.authorize;
});
beforeEach(() => { vi.clearAllMocks(); m.find.mockResolvedValue({ ...user }); m.raw.mockResolvedValue([{ count: 1 }]); m.compare.mockResolvedValue(true); });
const request = () => new Request("https://example.test/api/auth/callback/credentials", { headers: { "x-forwarded-for": "attacker-controlled" } });
describe("credential authorization at the shared entry point", () => {
  it("blocks a direct provider call before user lookup and bcrypt when quota is exhausted", async () => {
    m.raw.mockResolvedValue([]);
    expect(await authorize({ email: user.email, password: "password123" }, request())).toBeNull();
    expect(m.find).not.toHaveBeenCalled(); expect(m.compare).not.toHaveBeenCalled();
  });
  it("uses the same opaque account key regardless of email case, whitespace or supplied IP", async () => {
    const { consumeCredentialAttempt } = await import("../lib/credential-rate-limit");
    await consumeCredentialAttempt(" U@EXAMPLE.TEST "); await consumeCredentialAttempt("u@example.test");
    expect(m.raw.mock.calls[0][1]).toBe(m.raw.mock.calls[1][1]);
    expect(m.raw.mock.calls[0][1]).toMatch(/^[a-f0-9]{64}$/);
  });
  it("counts a wrong password and returns the version captured before password comparison", async () => {
    expect(await authorize({ email: user.email, password: "password123" }, request())).toMatchObject({ id: "u", sessionVersion: 0 });
    m.compare.mockResolvedValue(false);
    expect(await authorize({ email: user.email, password: "wrongpass" }, request())).toBeNull();
    expect(m.raw).toHaveBeenCalledTimes(2);
  });
  it("fails closed on limiter database errors and rejects malformed credentials before querying", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    m.raw.mockRejectedValueOnce(new Error("offline"));
    expect(await authorize({ email: user.email, password: "password123" }, request())).toBeNull();
    expect(m.compare).not.toHaveBeenCalled();
    vi.clearAllMocks();
    expect(await authorize({ email: "invalid", password: "x" }, request())).toBeNull();
    expect(m.raw).not.toHaveBeenCalled(); log.mockRestore();
  });
});
describe("session revocation", () => {
  const jwt = (token: Record<string, unknown>, extra = {}) => config.callbacks!.jwt!({ token, ...extra } as never);
  it("accepts a current version and immediately rejects it after a password reset increments the database version", async () => {
    const token = { id: "u", sessionVersion: 0 };
    expect(await jwt(token)).toMatchObject({ id: "u", sessionVersion: 0 });
    m.find.mockResolvedValue({ ...user, sessionVersion: 1 });
    expect(await jwt(token)).toBeNull();
  });
  it("requires legacy cookies and deleted accounts to sign in again", async () => {
    expect(await jwt({ id: "u" })).toBeNull();
    m.find.mockResolvedValue(null);
    expect(await jwt({ id: "u", sessionVersion: 0 })).toBeNull();
  });
  it("rejects a credential login racing with a reset instead of upgrading its session version", async () => {
    m.find.mockResolvedValue({ ...user, sessionVersion: 1 });
    expect(await jwt({ id: "u" }, { user, account: { provider: "credentials" } })).toBeNull();
  });
  it("stamps a new OAuth login and does not let a client session update revive an obsolete token", async () => {
    m.find.mockResolvedValue({ ...user, sessionVersion: 2 });
    expect(await jwt({ id: "u" }, { user, account: { provider: "github" } })).toMatchObject({ sessionVersion: 2 });
    expect(await jwt({ id: "u", sessionVersion: 0 }, { trigger: "update", session: { sessionVersion: 2 } })).toBeNull();
  });
});
