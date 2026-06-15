import { describe, it, expect } from "vitest";

import {
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validators";

describe("signUpSchema", () => {
  it("accepte des données valides", () => {
    const r = signUpSchema.safeParse({
      email: "a@b.co",
      username: "afro_maker",
      password: "motdepasse",
    });
    expect(r.success).toBe(true);
  });

  it("rejette un nom d'utilisateur invalide", () => {
    const r = signUpSchema.safeParse({
      email: "a@b.co",
      username: "Bad Name",
      password: "motdepasse",
    });
    expect(r.success).toBe(false);
  });

  it("rejette un mot de passe trop court", () => {
    const r = signUpSchema.safeParse({
      email: "a@b.co",
      username: "okuser",
      password: "court",
    });
    expect(r.success).toBe(false);
  });
});

describe("forgotPasswordSchema / resetPasswordSchema", () => {
  it("valide l'email et le nouveau mot de passe", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success,
    ).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "pasunemail" }).success).toBe(
      false,
    );
    expect(resetPasswordSchema.safeParse({ password: "12345678" }).success).toBe(
      true,
    );
    expect(resetPasswordSchema.safeParse({ password: "1234" }).success).toBe(
      false,
    );
  });
});
