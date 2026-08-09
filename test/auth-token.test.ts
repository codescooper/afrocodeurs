import { describe, expect, it } from "vitest";

import { minimizeAuthToken } from "@/lib/auth-token";

describe("minimizeAuthToken", () => {
  it("retire les champs de profil volumineux du cookie de session", () => {
    const token = minimizeAuthToken({
      sub: "auth-user-id",
      id: "database-user-id",
      username: "codescooper",
      role: "USER",
      isEmailVerified: true,
      name: "Code Scooper",
      email: "user@example.com",
      picture: `data:image/png;base64,${"a".repeat(20_000)}`,
    });

    expect(token).toEqual({
      sub: "auth-user-id",
      id: "database-user-id",
      username: "codescooper",
      role: "USER",
      isEmailVerified: true,
    });
  });
});
