import { describe, it, expect } from "vitest";

import { slugify } from "@/lib/utils";

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
