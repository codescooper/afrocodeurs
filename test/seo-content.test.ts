import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ community: vi.fn(), venture: vi.fn(), knowledge: vi.fn(), project: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  community: { findUnique: mocks.community }, communityVenture: { findFirst: mocks.venture },
  knowledge: { findFirst: mocks.knowledge }, project: { findFirst: mocks.project },
} }));
import { publicContentMetadata } from "../features/seo/metadata";

beforeEach(() => vi.resetAllMocks());

it("uses the real community name and description", async () => {
  mocks.community.mockResolvedValue({ name: "AfroCodeurs Abidjan", description: "La communauté tech à Abidjan." });
  const data = await publicContentMetadata("communities", "abidjan");
  expect(data).toMatchObject({ title: "AfroCodeurs Abidjan", description: "La communauté tech à Abidjan." });
});
it("loads only published Constellation fiches for SEO", async () => {
  mocks.venture.mockResolvedValue({ name: "Une réalisation", summary: "Un service déployé." });
  expect(await publicContentMetadata("constellation", "service")).toMatchObject({ title: "Une réalisation" });
  expect(mocks.venture).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "service", status: "PUBLISHED" } }));
});
it("does not expose a draft title in metadata", async () => {
  mocks.knowledge.mockResolvedValue(null);
  expect(await publicContentMetadata("knowledge", "brouillon")).toEqual({ robots: { index: false, follow: false } });
  expect(mocks.knowledge).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "brouillon", status: "PUBLISHED" } }));
});
