import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), upsert: vi.fn(), configure: vi.fn(), findUser: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUser }, profile: { upsert: mocks.upsert } } }));
vi.mock("next-auth", () => ({ default: (config: NextAuthConfig) => {
  mocks.configure(config);
  return { auth: mocks.auth, handlers: {}, signIn: vi.fn(), signOut: vi.fn() };
} }));

let config: NextAuthConfig;
beforeAll(async () => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "google-test");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-secret");
  vi.stubEnv("GITHUB_CLIENT_ID", "github-test");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "github-secret");
  await import("../lib/auth");
  config = mocks.configure.mock.calls[0][0];
});
beforeEach(() => {
  mocks.auth.mockResolvedValue(null);
  mocks.upsert.mockReset();
  mocks.findUser.mockReset();
});
const user = { id: "database-user", email: "amina@example.org", emailVerified: null };
const google = { provider: "google", type: "oidc" as const, providerAccountId: "provider-user" };
const github = { provider: "github", type: "oauth" as const, providerAccountId: "provider-user" };

describe("OAuth callbacks and account policy", () => {
  it("does not look up an avatar without an authenticated database user id", async () => {
    await config.callbacks!.session!({ session: { user: {}, expires: "2030-01-01" }, token: {} } as never);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });
  it("restores the current avatar in the session without expanding the JWT", async () => {
    const image = `data:image/jpeg;base64,${"a".repeat(20_000)}`;
    mocks.findUser.mockResolvedValue({ name: "Amina", image });
    const token = { id: "database-user", username: "amina", role: "USER", isEmailVerified: true };
    const result = await config.callbacks!.session!({ session: { user: {}, expires: "2030-01-01" }, token } as never);
    expect(result.user).toMatchObject({ name: "Amina", image });
    expect(token).not.toHaveProperty("picture");
    expect(token).not.toHaveProperty("image");
    expect(mocks.findUser).toHaveBeenCalledWith({ where: { id: "database-user" }, select: { name: true, image: true } });
  });
  it("never enables automatic email-based account linking", () => {
    for (const value of config.providers) {
      const provider = typeof value === "function" ? value() : value;
      if (provider.type === "oauth" || provider.type === "oidc") {
        expect(provider.allowDangerousEmailAccountLinking).not.toBe(true);
        expect(provider.options?.allowDangerousEmailAccountLinking).not.toBe(true);
      }
    }
  });
  it("rejects an unverified Google email", async () => {
    expect(await config.callbacks!.signIn!({ user, account: google, profile: { email_verified: false } }))
      .toBe("/login?error=EmailNotVerified");
  });
  it("accepts a verified Google identity without creating a profile prematurely", async () => {
    expect(await config.callbacks!.signIn!({ user, account: google, profile: { email_verified: true } })).toBe(true);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("requires an email for GitHub", async () => {
    expect(await config.callbacks!.signIn!({ user: { ...user, email: null }, account: github, profile: {} }))
      .toBe("/login?error=EmailRequired");
  });
  it("prevents linking from an unverified session even via a direct callback", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "existing-user", isEmailVerified: false } });
    expect(await config.callbacks!.signIn!({ user, account: github, profile: {} }))
      .toBe("/dashboard/settings?error=EmailNotVerified");
  });
  it("saves the GitHub login after successful sign-in with the database user id", async () => {
    await config.events!.signIn!({ user, account: github, profile: { login: "amina-code" }, isNewUser: true });
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { userId: "database-user" },
      create: { userId: "database-user", githubLogin: "amina-code" },
      update: { githubLogin: "amina-code" },
    });
  });
});
