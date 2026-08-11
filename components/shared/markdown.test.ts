import { describe, expect, it } from "vitest";

import { normalizeMarkdownSource } from "./markdown";

describe("normalizeMarkdownSource", () => {
  it("retire une cl?ture markdown qui enveloppe tout l'article", () => {
    expect(normalizeMarkdownSource("```markdown\n# Titre\n\nTexte\n```"))
      .toBe("# Titre\n\nTexte");
  });

  it("conserve les blocs de code internes", () => {
    const source = "# Exemple\n\n```ts\nconst ok = true;\n```";
    expect(normalizeMarkdownSource(source)).toBe(source);
  });

  it("conserve un article markdown normal", () => {
    const source = "# Titre\n\n![Image](/uploads/image.png)";
    expect(normalizeMarkdownSource(source)).toBe(source);
  });
});
