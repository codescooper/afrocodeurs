import { describe, expect, it } from "vitest";
import { challengeScore } from "@/features/challenges/constants";
import { challengeAnswerSchema, challengeSchema } from "@/lib/validators";

describe("challengeScore", () => {
  it("applique les pénalités d'indices et de tentatives", () => {
    expect(challengeScore(100, 1, 0)).toBe(100);
    expect(challengeScore(100, 3, 25)).toBe(69);
  });

  it("conserve un minimum de points", () => {
    expect(challengeScore(50, 30, 100)).toBe(10);
  });
});

describe("challenge validators", () => {
  it("accepte une énigme complète", () => {
    expect(challengeSchema.safeParse({
      title: "Le terminal du baobab",
      story: "Une console ancienne attend votre commande.",
      instructions: "Trouvez le mot caché dans cette suite logique.",
      difficulty: "EXPLORER",
      mode: "PIXEL_TERMINAL",
      answer: "ubuntu",
      solutionExplanation: "Chaque caractère provenait de la première colonne.",
      hint1: "Regardez verticalement.",
    }).success).toBe(true);
  });

  it("rejette un moteur interactif non autorisé", () => {
    expect(challengeSchema.safeParse({
      title: "Moteur arbitraire",
      instructions: "Cette énigme tente de charger un moteur inconnu.",
      difficulty: "INITIATE",
      mode: "JAVASCRIPT_ARBITRAIRE",
      answer: "AFRO{test}",
      solutionExplanation: "Le moteur ne doit jamais être accepté par la validation.",
    }).success).toBe(false);
  });

  it("rejette une réponse vide", () => {
    expect(challengeAnswerSchema.safeParse({ answer: "" }).success).toBe(false);
  });
});
