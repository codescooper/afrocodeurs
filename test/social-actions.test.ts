import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), signIn: vi.fn(), rateLimit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth, signIn: mocks.signIn }));
vi.mock("next-auth", async () => {
  const { AuthError } = await import("@auth/core/errors");
  return { AuthError };
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/lib/rate-limit", () => ({ clientIp: async () => "test", rateLimit: mocks.rateLimit }));
import { socialSignInAction } from "../features/auth/social-actions";

function form(provider = "github", link = false) {
  const data = new FormData();
  data.set("provider", provider);
  if (link) data.set("intent", "link");
  data.set("redirectTo", "https://evil.example");
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("GITHUB_CLIENT_ID", "test-id");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "test-secret");
  mocks.auth.mockResolvedValue(null);
  mocks.rateLimit.mockReturnValue({ ok: true });
});

describe("social sign-in action", () => {
  it("rejects arbitrary providers", async () => {
    await expect(socialSignInAction(form("evil"))).rejects.toThrow("ProviderUnavailable");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("uses a fixed safe redirect for login", async () => {
    await socialSignInAction(form());
    expect(mocks.signIn).toHaveBeenCalledWith("github", { redirectTo: "/dashboard" });
  });
  it("does not silently link from the login screen", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u", isEmailVerified: true } });
    await expect(socialSignInAction(form())).rejects.toThrow("REDIRECT:/dashboard");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("requires a verified session for linking", async () => {
    await expect(socialSignInAction(form("github", true))).rejects.toThrow("EmailNotVerified");
    mocks.auth.mockResolvedValue({ user: { id: "u", isEmailVerified: false } });
    await expect(socialSignInAction(form("github", true))).rejects.toThrow("EmailNotVerified");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("returns to settings after explicit linking", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u", isEmailVerified: true } });
    await socialSignInAction(form("github", true));
    expect(mocks.signIn).toHaveBeenCalledWith("github", { redirectTo: "/dashboard/settings" });
  });
  it("rate limits attempts before calling the provider", async () => {
    mocks.rateLimit.mockReturnValue({ ok: false });
    await expect(socialSignInAction(form())).rejects.toThrow("RateLimit");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("preserves the framework redirect", async () => {
    mocks.signIn.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(socialSignInAction(form())).rejects.toThrow("NEXT_REDIRECT");
  });
});
