import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), rateLimit: vi.fn(), notify: vi.fn(), transaction: vi.fn(), claimCreate: vi.fn(), solutionFind: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/guard", () => ({ guard: mocks.guard, invalidMessage: () => "Données invalides" }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/features/notifications/notify", () => ({ notify: mocks.notify }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mocks.transaction, solution: { findUnique: mocks.solutionFind }, solutionClaim: { createMany: mocks.claimCreate } } }));
import { requestSolutionClaimAction, updateSolutionCatalogAction, verifySolutionLicenseAction } from "../features/solutions/catalog-actions";

const tx = { solution: { findUnique: vi.fn(), updateMany: vi.fn() }, solutionMaintainer: { findUnique: vi.fn() }, auditLog: { create: vi.fn() } };
const form = (extra: Record<string, string> = {}) => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id: "solution", revision: "1", name: "Une solution", description: "Une solution concrète utile aux réalités du continent.", type: "SOFTWARE", country: "Bénin", license: "MIT", repositoryUrl: "https://github.com/example/project", ...extra })) data.set(key, value);
  return data;
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ ok: true, user: { id: "user", role: "USER" } });
  mocks.rateLimit.mockReturnValue({ ok: true });
  mocks.transaction.mockImplementation(work => work(tx));
  tx.solution.findUnique.mockResolvedValue({ id: "solution", slug: "solution", name: "Ancien nom", description: "Ancienne description", revision: 1, repositoryUrl: "https://github.com/example/project", license: "MIT", licenseVerified: true });
  tx.solution.updateMany.mockResolvedValue({ count: 1 });
  tx.solutionMaintainer.findUnique.mockResolvedValue({ userId: "user" });
});
it("denies unauthenticated actions before database writes", async () => {
  mocks.guard.mockResolvedValue({ ok: false, error: "Connexion nécessaire" });
  expect(await updateSolutionCatalogAction(undefined, form())).toEqual({ error: "Connexion nécessaire" });
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("does not grant edit access from the original referencing author or submitted role", async () => {
  tx.solutionMaintainer.findUnique.mockResolvedValue(null);
  expect(await updateSolutionCatalogAction(undefined, form({ role: "ADMIN", createdById: "user" }))).toHaveProperty("error");
  expect(tx.solution.updateMany).not.toHaveBeenCalled();
});
it("ignores forged license verification and optimistic revision is required", async () => {
  expect(await updateSolutionCatalogAction(undefined, form({ licenseVerified: "true", repositoryUrl: "https://github.com/changed/repo" }))).toHaveProperty("success");
  expect(tx.solution.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "solution", revision: 1 }, data: expect.objectContaining({ licenseVerified: false, revision: { increment: 1 } }) }));
  expect(tx.auditLog.create).toHaveBeenCalled();
});
it("preserves verification for unrelated edits", async () => {
  await updateSolutionCatalogAction(undefined, form());
  expect(tx.solution.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ licenseVerified: true }) }));
});
it("rejects stale writes without creating an audit entry", async () => {
  tx.solution.updateMany.mockResolvedValue({ count: 0 });
  expect(await updateSolutionCatalogAction(undefined, form())).toHaveProperty("error");
  expect(tx.auditLog.create).not.toHaveBeenCalled();
});
it("requires administrator license review with a source note", async () => {
  expect(await verifySolutionLicenseAction(undefined, form({ verified: "yes", note: "Licence MIT vérifiée dans le dépôt officiel" }))).toHaveProperty("error");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("does not mark a solution without source repository as open source", async () => {
  mocks.guard.mockResolvedValue({ ok: true, user: { id: "admin", role: "ADMIN" } });
  tx.solution.findUnique.mockResolvedValue({ id: "solution", license: "MIT", repositoryUrl: null });
  expect(await verifySolutionLicenseAction(undefined, form({ verified: "yes", note: "Licence MIT vérifiée dans le dépôt officiel" }))).toHaveProperty("error");
  expect(tx.solution.updateMany).not.toHaveBeenCalled();
});
it("creates only a claim and never membership on submission", async () => {
  mocks.solutionFind.mockResolvedValue({ slug: "solution" });
  const data = form({ solutionId: "solution", evidence: "Je peux placer le code de contrôle dans le dépôt officiel du projet." });
  expect(await requestSolutionClaimAction(undefined, data)).toHaveProperty("success");
  expect(mocks.claimCreate).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("throttles repeated claims", async () => {
  mocks.rateLimit.mockReturnValue({ ok: false });
  expect(await requestSolutionClaimAction(undefined, form({ solutionId: "solution", evidence: "Je peux placer le code de contrôle dans le dépôt officiel du projet." }))).toHaveProperty("error");
  expect(mocks.claimCreate).not.toHaveBeenCalled();
});
