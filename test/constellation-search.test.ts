import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), blocks: vi.fn(), models: Object.fromEntries(["problem", "knowledge", "question", "community", "solution", "project", "user", "communityVenture"].map(name => [name, { findMany: vi.fn() }])) }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: mocks.models }));
vi.mock("@/features/constellation/queries", () => ({ ventureBlockedIds: mocks.blocks }));
import { globalSearch } from "../features/search/search";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "viewer" } }); mocks.blocks.mockResolvedValue(["blocked"]);
  for (const model of Object.values(mocks.models)) model.findMany.mockResolvedValue([]);
});
it("includes public Constellation results, honors blocking and counts them", async () => {
  mocks.models.communityVenture.findMany.mockResolvedValue([{ name: "Projet", slug: "projet", summary: "Résumé public" }]);
  const result = await globalSearch("développement web");
  expect(result.total).toBe(1);
  expect(result.ventures[0].href).toBe("/constellation/projet");
  expect(mocks.blocks).toHaveBeenCalledWith("viewer");
  expect(mocks.models.communityVenture.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED", ownerId: { notIn: ["blocked"] }, AND: [{ searchText: { contains: "developpement" } }, { searchText: { contains: "web" } }] }, select: { name: true, slug: true, summary: true } }));
  expect(JSON.stringify(result)).not.toContain("pendingChanges");
});
it("does not query any entity for empty or one-character global searches", async () => {
  expect((await globalSearch(" ")).total).toBe(0);
  expect((await globalSearch("x")).total).toBe(0);
  expect(mocks.auth).not.toHaveBeenCalled();
});
