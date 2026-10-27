import { expect, it } from "vitest";
import { foldText, parseKeywords, ventureSearchText, ventureSearchWhere } from "../features/constellation/keywords";
import { ventureSchema } from "../features/constellation/validators";

const fields = { name: "Projet", summary: "Un service communautaire déjà en ligne.", description: "Un service communautaire déjà en ligne qui permet de répondre aux besoins des familles et des professionnels.", country: "CI", sector: "SERVICES", websiteUrl: "https://example.org", logoUrl: "", screenshots: "", needs: "", openSourceProjectId: "", confirmed: "on" };

it("splits common separators, removes duplicates without stripping meaningful accents", () => {
  expect(parseKeywords("Design; développement\ntests, DESIGN, developpement, C, C++, C#")).toEqual(["design", "développement", "tests", "c", "c++", "c#"]);
});
it("accepts C and gives a French error for a seventh keyword", () => {
  expect(ventureSchema.parse({ ...fields, needs: "C, C++, IA" }).needs).toEqual(["c", "c++", "ia"]);
  const result = ventureSchema.safeParse({ ...fields, needs: "a,b,c,d,e,f,g" });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues[0].message).toBe("Choisis au maximum 6 mots-clés de collaboration.");
});
it("returns a field-specific French error for an oversized keyword", () => {
  const result = ventureSchema.safeParse({ ...fields, needs: "a".repeat(51) });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues[0].message).toContain("Un mot-clé");
});
it("searches normalized partial words including descriptions and needs", () => {
  expect(foldText("DÉVELOPPEMENT  Œuvre")).toBe("developpement oeuvre");
  expect(ventureSearchText({ name: "Projet", summary: "Résumé", description: "Éducation", needs: ["développement web"] })).toContain("education developpement web");
  expect(ventureSearchWhere("Dév WEB")).toEqual({ AND: [{ searchText: { contains: "dev" } }, { searchText: { contains: "web" } }] });
});
it("requires a revision for edits but not new submissions", () => {
  expect(ventureSchema.safeParse(fields).success).toBe(true);
  expect(ventureSchema.safeParse({ ...fields, id: "v" }).success).toBe(false);
  expect(ventureSchema.safeParse({ ...fields, id: "v", revision: "2" }).success).toBe(true);
});
