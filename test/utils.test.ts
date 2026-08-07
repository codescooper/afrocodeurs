import { describe, it, expect } from "vitest";

import { slugify, normalizeUsername } from "@/lib/utils";

describe("slugify", () => {
  it("gère accents, espaces et casse", () => {
    expect(slugify("Énergie Solaire en Afrique")).toBe(
      "energie-solaire-en-afrique",
    );
    expect(slugify("  Côte d'Ivoire  ")).toBe("cote-d-ivoire");
    expect(slugify("React & Next.js")).toBe("react-next-js");
  });

  it("supprime les tirets en début et fin", () => {
    expect(slugify("--Hello--")).toBe("hello");
  });
});

describe("normalizeUsername", () => {
  it("retire accents, espaces et caractères interdits", () => {
    expect(normalizeUsername("Moussa Diop")).toBe("moussa_diop");
    expect(normalizeUsername("Awa-Cissé")).toBe("awa_cisse");
    expect(normalizeUsername("Où va Kéba ?")).toBe("ou_va_keba");
  });

  it("accepte les underscores existants et met en minuscules", () => {
    expect(normalizeUsername("Dev_Africa_2026")).toBe("dev_africa_2026");
    expect(normalizeUsername("JOHN")).toBe("john");
  });

  it("tronque à 30 caractères", () => {
    expect(normalizeUsername("a".repeat(45))).toBe("a".repeat(30));
  });
});
