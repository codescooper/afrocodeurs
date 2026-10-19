import { describe, expect, it } from "vitest";
import { socialAuthError, socialProviderConfig } from "../lib/oauth-config";

describe("OAuth configuration", () => {
  it("hides unconfigured and half-configured providers", () => {
    expect(socialProviderConfig({})).toEqual([]);
    expect(socialProviderConfig({ GOOGLE_CLIENT_ID: "id" })).toEqual([]);
    expect(socialProviderConfig({ GITHUB_CLIENT_SECRET: "secret" })).toEqual([]);
  });
  it("supports the documented environment names", () => {
    expect(socialProviderConfig({ GOOGLE_CLIENT_ID: " id ", GOOGLE_CLIENT_SECRET: " secret " }))
      .toEqual([{ id: "google", clientId: "id", clientSecret: "secret" }]);
  });
  it("does not combine incomplete pairs from different applications", () => {
    expect(socialProviderConfig({ GOOGLE_CLIENT_ID: "legacy", AUTH_GOOGLE_SECRET: "other" })).toEqual([]);
  });
  it("supports Auth.js standard environment names", () => {
    expect(socialProviderConfig({ AUTH_GITHUB_ID: "id", AUTH_GITHUB_SECRET: "secret" }))
      .toEqual([{ id: "github", clientId: "id", clientSecret: "secret" }]);
  });
  it("does not expose an arbitrary OAuth error as visible copy", () => {
    expect(socialAuthError(undefined)).toBeNull();
    expect(socialAuthError("<private-provider-error>")).not.toContain("private-provider-error");
    expect(socialAuthError("OAuthAccountNotLinked")).toContain("méthode habituelle");
  });
});
