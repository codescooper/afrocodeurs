import { describe, expect, it } from "vitest";

import { analyzeFeedback } from "@/features/product-feedback/analyze";

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
});
