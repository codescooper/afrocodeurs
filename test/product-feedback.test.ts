import { describe, expect, it } from "vitest";

import { analyzeFeedback } from "@/features/product-feedback/analyze";
import {
  feedbackAttribution,
  feedbackStatusForGoal,
  problemStatusForGoal,
  questionStatusForGoal,
  releaseSummary,
  releaseVersion,
} from "@/features/product-feedback/workflow";

describe("analyzeFeedback", () => {
  it("classe un blocage comme bug prioritaire", () => {
    const result = analyzeFeedback(
      "Publication impossible",
      "Tous les membres sont bloqués par une erreur lors de la publication.",
    );
    expect(result.category).toBe("BUG");
    expect(result.priorityScore).toBeGreaterThanOrEqual(4);
  });

  it("détecte une fonctionnalité manquante", () => {
    const result = analyzeFeedback(
      "Ajouter des brouillons",
      "Il faudrait intégrer une fonctionnalité pour sauvegarder le travail.",
    );
    expect(result.category).toBe("MISSING_FEATURE");
  });

  it("exige toujours une validation humaine", () => {
    const result = analyzeFeedback(
      "Une suggestion générale",
      "Voici une amélioration possible pour la plateforme.",
    );
    expect(result.analysis).toContain("Validation humaine requise");
  });

  it("détecte un bug sans tenir compte de la casse", () => {
    const result = analyzeFeedback(
      "BUG de Publication",
      "Les membres sont BloQUés par plusieurs ERREURS.",
    );
    expect(result.category).toBe("BUG");
    expect(result.priorityScore).toBeGreaterThanOrEqual(4);
  });

  it("reconnaît les variantes accentuées et plurielles d’une fonctionnalité", () => {
    const result = analyzeFeedback(
      "Nouvelles fonctionnalités",
      "Il faudrait ajouter des fonctionnalités de planification.",
    );
    expect(result.category).toBe("MISSING_FEATURE");
  });
});

describe("cycle de vie des demandes", () => {
  it("synchronise le statut public avec l’objectif", () => {
    expect(feedbackStatusForGoal("PLANNED")).toBe("CONVERTED");
    expect(feedbackStatusForGoal("IN_PROGRESS")).toBe("IN_PROGRESS");
    expect(feedbackStatusForGoal("SHIPPED")).toBe("RESOLVED");
    expect(feedbackStatusForGoal("CANCELLED")).toBe("REJECTED");
  });

  it("synchronise les contenus sources sans confondre livraison et progression", () => {
    expect(problemStatusForGoal("PLANNED")).toBe("VALIDATED");
    expect(problemStatusForGoal("IN_PROGRESS")).toBe("ACTIVE");
    expect(problemStatusForGoal("SHIPPED")).toBe("ARCHIVED");
    expect(questionStatusForGoal("PLANNED")).toBe("ANSWERED");
    expect(questionStatusForGoal("SHIPPED")).toBe("SOLVED");
    expect(questionStatusForGoal("CANCELLED")).toBe("CLOSED");
  });

  it("crédite plusieurs auteurs sans doublon", () => {
    expect(
      feedbackAttribution([
        { author: { username: "isko" } },
        { author: { username: "devpdg" } },
        { author: { username: "isko" } },
      ]),
    ).toBe("@isko et @devpdg");
  });

  it("privilégie le libellé public choisi pour le livre d’or", () => {
    expect(
      feedbackAttribution([
        {
          submittedByLabel: "Steve Aster Afovo",
          author: { username: "steveasterafovo" },
        },
      ]),
    ).toBe("Steve Aster Afovo");
  });

  it("prépare une nouveauté concise et datée pour la Côte d’Ivoire", () => {
    expect(releaseVersion(new Date("2026-08-29T13:00:00Z"))).toBe("Août 2026");
    expect(releaseSummary(`  ${"a".repeat(400)}  `)).toHaveLength(320);
    expect(releaseSummary("Une amélioration claire.")).toBe(
      "Une amélioration claire.",
    );
  });
});
