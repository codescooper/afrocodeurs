import { beforeEach, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
vi.mock("server-only", () => ({}));
import { reviewSolutionClaim } from "../features/solutions/claim-service";
import { catalogFilters, catalogSchema, claimSchema, normalizeCatalogParams, reviewClaimSchema } from "../features/solutions/catalog";

const tx = { $queryRaw: vi.fn(), solutionClaim: { findUnique: vi.fn(), updateMany: vi.fn() }, solutionMaintainer: { upsert: vi.fn() }, auditLog: { create: vi.fn() } };
const transaction = vi.fn();
const db = { $transaction: transaction } as unknown as PrismaClient;
const input = { id: "claim", status: "APPROVED" as const, note: "Code temporaire vérifié dans le dépôt officiel." };
beforeEach(() => {
  vi.resetAllMocks();
  transaction.mockImplementation(work => work(tx));
  tx.solutionClaim.findUnique.mockResolvedValue({ id: "claim", solutionId: "solution", userId: "claimant", status: "PENDING", solution: { slug: "solution" } });
  tx.solutionClaim.updateMany.mockResolvedValue({ count: 1 });
});

it.each(["USER", "CONTRIBUTOR", "MODERATOR"] as const)("does not grant review to %s", async role => {
  await expect(reviewSolutionClaim(db, { id: "reviewer", role }, input)).rejects.toThrow("administrateurs");
  expect(transaction).not.toHaveBeenCalled();
});
it("requires independent review even for an administrator", async () => {
  await expect(reviewSolutionClaim(db, { id: "claimant", role: "ADMIN" }, input)).rejects.toThrow("autre administrateur");
  expect(tx.solutionMaintainer.upsert).not.toHaveBeenCalled();
});
it("grants one membership and audits the decision in the transaction", async () => {
  expect(await reviewSolutionClaim(db, { id: "reviewer", role: "ADMIN" }, input)).toEqual({ userId: "claimant", slug: "solution" });
  expect(tx.solutionClaim.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "claim", status: "PENDING" } }));
  expect(tx.solutionMaintainer.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { solutionId: "solution", userId: "claimant" } }));
  expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ metadata: expect.objectContaining({ operation: "solution_claim_review", note: input.note }) }) });
});
it("does not grant access when rejected", async () => {
  await reviewSolutionClaim(db, { id: "reviewer", role: "ADMIN" }, { ...input, status: "REJECTED" });
  expect(tx.solutionMaintainer.upsert).not.toHaveBeenCalled();
});
it("rejects duplicate and concurrent decisions", async () => {
  tx.solutionClaim.updateMany.mockResolvedValue({ count: 0 });
  await expect(reviewSolutionClaim(db, { id: "reviewer", role: "ADMIN" }, input)).rejects.toThrow("traitée");
  expect(tx.solutionMaintainer.upsert).not.toHaveBeenCalled();
  expect(tx.auditLog.create).not.toHaveBeenCalled();
});
it("does not revisit a final decision", async () => {
  tx.solutionClaim.findUnique.mockResolvedValue({ status: "REJECTED" });
  await expect(reviewSolutionClaim(db, { id: "reviewer", role: "ADMIN" }, input)).rejects.toThrow("attente");
});
it("normalizes lists without inventing license verification", () => {
  const parsed = catalogSchema.parse({ countriesServed: "Sénégal, Bénin, Sénégal", languages: "français, anglais", licenseVerified: true });
  expect(parsed.countriesServed).toEqual(["Sénégal", "Bénin"]);
  expect(parsed).not.toHaveProperty("licenseVerified");
});
it.each(["javascript:alert(1)", "file:///etc/passwd", "https://user:secret@example.org"])("rejects unsafe repository URL %s", repositoryUrl => {
  expect(catalogSchema.safeParse({ repositoryUrl }).success).toBe(false);
});
it("requires evidence, not a matching username", () => {
  expect(claimSchema.safeParse({ solutionId: "one", evidence: "C’est mon nom" }).success).toBe(false);
});
it("requires explicit confirmation before approving control", () => {
  expect(reviewClaimSchema.safeParse({ ...input }).success).toBe(false);
  expect(reviewClaimSchema.safeParse({ ...input, confirmed: "on" }).success).toBe(true);
});
it("ignores repeated query parameters instead of passing arrays to Prisma", () => {
  expect(normalizeCatalogParams({ country: ["CI", "SN"], q: "a".repeat(500) })).toMatchObject({ country: undefined, q: "a".repeat(120) });
});
it("filters by served country and verified license rather than origin", () => {
  expect(catalogFilters({ country: "Bénin", open: "1", sector: "INVALID", lifecycle: "INVALID" })).toEqual({ countriesServed: { has: "Bénin" }, licenseVerified: true, repositoryUrl: { not: null } });
});
