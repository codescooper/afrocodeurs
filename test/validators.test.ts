import { describe, it, expect } from "vitest";

import {
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  knowledgeSchema,
  projectSchema,
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

  it("convertit automatiquement les majuscules en minuscules", () => {
    const result = signUpSchema.safeParse({
      email: "angel@example.com",
      username: "Angel",
      password: "motdepasse",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.username).toBe("angel");
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

describe("projectSchema", () => {
  it("accepte la transformation d'une solution en projet", () => {
    const result = projectSchema.safeParse({
      name: "Santé rurale mobile",
      description: "Un projet collaboratif issu d'une solution validée.",
      githubRepo: "afrocodeurs/sante-rurale",
      websiteUrl: "",
      status: "IDEA",
      problemId: "problem-1",
      solutionId: "solution-1",
      communityId: "",
    });

    expect(result.success).toBe(true);
  });
});

describe("knowledgeSchema", () => {
  it("accepte un cours externe gratuit", () => {
    const result = knowledgeSchema.safeParse({
      title: "Comprendre Git en pratique",
      summary: "Un cours accessible aux débutants.",
      content: "Une présentation suffisamment détaillée.",
      type: "COURSE",
      language: "fr",
      level: "Débutant",
      externalUrl: "https://example.com/cours-git",
      provider: "AfroCodeurs",
      durationMinutes: "45",
      isFree: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un lien externe invalide", () => {
    const result = knowledgeSchema.safeParse({
      title: "Une ressource invalide",
      content: "Une présentation suffisamment détaillée.",
      type: "LINK",
      language: "fr",
      externalUrl: "pas-un-lien",
      isFree: true,
    });
    expect(result.success).toBe(false);
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
