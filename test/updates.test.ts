import { describe, expect, it } from "vitest";
import { platformUpdateSchema } from "@/features/updates/validators";

describe("platformUpdateSchema", () => {
  it("accepte une note de version complète", () => {
    expect(platformUpdateSchema.safeParse({ version: "Août 2026", title: "Une nouvelle messagerie", summary: "Les membres peuvent maintenant échanger entre eux.", content: "## Messagerie\n\nCréez une conversation privée ou un groupe.", category: "NOUVEAUTÉ" }).success).toBe(true);
  });

  it("rejette les publications trop vagues", () => {
    expect(platformUpdateSchema.safeParse({ version: "v1", title: "Test", summary: "Trop court", content: "Court", category: "NEW" }).success).toBe(false);
  });
});
