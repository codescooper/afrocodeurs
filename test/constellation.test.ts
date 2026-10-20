import { describe, expect, it } from "vitest";
import { publicWebsite, trustedMedia, ventureSchema, collaborationSchema } from "../features/constellation/validators";
import { constellationHeight, constellationLayout } from "../features/constellation/layout";
import { countryName } from "../features/constellation/constants";

const fields = { name: "Sunu Santé", summary: "Un service de prise de rendez-vous accessible aux familles.", description: "Cette réalisation accompagne les familles dans la prise de rendez-vous avec des professionnels de santé et facilite leur suivi au quotidien.", country: "sn", sector: "HEALTH", websiteUrl: "https://sunu.example.org", logoUrl: "", screenshots: "", needs: "design, tests, design", openSourceProjectId: "", confirmed: "on" };
describe("Constellation input", () => {
  it("creates a deployed realization without requiring GitHub", () => {
    expect(ventureSchema.parse(fields)).toMatchObject({ country: "SN", needs: ["design", "tests"], openSourceProjectId: "" });
    expect(countryName("CI")).toContain("Ivoire");
  });
  it.each(["http://example.org", "javascript:alert(1)", "https://localhost", "https://127.0.0.1", "https://0x7f000001", "https://[::1]", "https://service.internal", "https://u:p@example.org"])("rejects unsafe website %s", (url) => {
    expect(publicWebsite(url)).toBe(false);
  });
  it("requires a valid ISO country, sector and publishing rights confirmation", () => {
    for (const override of [{ country: "ZZ" }, { sector: "FAKE" }, { confirmed: "" }]) expect(ventureSchema.safeParse({ ...fields, ...override }).success).toBe(false);
  });
  it("accepts only uploaded images on approved storage", () => {
    const env = { NEXT_PUBLIC_SITE_URL: "https://afrocodeurs.org", S3_PUBLIC_URL: "https://cdn.example.org/media" };
    expect(trustedMedia("/uploads/2026/10/logo.png", env)).toBe(true);
    expect(trustedMedia("https://cdn.example.org/media/uploads/2026/a.webp", env)).toBe(true);
    for (const url of ["https://evil.example/logo.png", "data:image/png;base64,AAA", "/uploads/../../private.png", "https://u:p@afrocodeurs.org/uploads/a.png", "https://afrocodeurs.org/uploads/a.png?secret=x"]) expect(trustedMedia(url, env)).toBe(false);
  });
  it("bounds screenshots and collaboration details", () => {
    expect(ventureSchema.safeParse({ ...fields, screenshots: Array(4).fill("/uploads/a.png").join("\n") }).success).toBe(false);
    expect(collaborationSchema.safeParse({ command: "request", id: "a", message: "salut" }).success).toBe(false);
    expect(collaborationSchema.safeParse({ command: "respond", id: "a", status: "PUBLISHED" }).success).toBe(false);
  });
});
describe("Constellation placement", () => {
  it("is deterministic, bounded and does not mutate identifiers", () => {
    const ids = Array.from({ length: 18 }, (_, i) => `venture-${i}`);
    const original = [...ids];
    for (const width of [360, 980]) {
      const height = constellationHeight(ids.length, width);
      const positions = constellationLayout(ids, width, height);
      expect(positions).toEqual(constellationLayout(ids, width, height));
      for (const point of positions) {
        expect(point.x).toBeGreaterThanOrEqual(48); expect(point.x).toBeLessThanOrEqual(width - 48);
        expect(point.y).toBeGreaterThanOrEqual(58); expect(point.y).toBeLessThanOrEqual(height - 58);
      }
      positions.forEach((point, index) => positions.slice(index + 1).forEach((other) => {
        expect(Math.abs(point.x - other.x) >= 110 || Math.abs(point.y - other.y) >= 120).toBe(true);
      }));
    }
    expect(ids).toEqual(original);
    expect(constellationLayout([], 360, 640)).toEqual([]);
  });
});
