import { beforeEach, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
vi.mock("server-only", () => ({}));
vi.mock("@/features/notifications/push", () => ({ sendPush: vi.fn() }));
import { reviewVenture } from "../features/constellation/service";

const tx = {
  communityVenture: { findUnique: vi.fn(), updateMany: vi.fn() },
  auditLog: { create: vi.fn() },
  user: { findUnique: vi.fn() }, notification: { create: vi.fn() },
};
const transaction = vi.fn();
const db = { $transaction: transaction } as unknown as PrismaClient;
const input = { id: "venture", revision: 2, status: "PUBLISHED" as const, note: "" };
beforeEach(() => {
  vi.resetAllMocks();
  transaction.mockImplementation(work => work(tx));
  tx.communityVenture.findUnique.mockResolvedValue({ id: "venture", ownerId: "owner", status: "PENDING", revision: 2 });
  tx.communityVenture.updateMany.mockResolvedValue({ count: 1 });
});
it("allows and audits admin self-approval without notifying oneself", async () => {
  await reviewVenture(db, { id: "owner", role: "ADMIN" }, input);
  expect(tx.communityVenture.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "venture", status: "PENDING", revision: 2 } }));
  expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: "owner", metadata: { operation: "review", selfReview: true, reviewerRole: "ADMIN" } }) });
  expect(tx.notification.create).not.toHaveBeenCalled();
});
it("still rejects moderator self-approval", async () => {
  await expect(reviewVenture(db, { id: "owner", role: "MODERATOR" }, input)).rejects.toThrow("autre personne");
  expect(tx.communityVenture.updateMany).not.toHaveBeenCalled();
  expect(tx.auditLog.create).not.toHaveBeenCalled();
});
it("rejects ordinary members before opening a transaction", async () => {
  await expect(reviewVenture(db, { id: "owner", role: "USER" }, input)).rejects.toThrow("modération");
  expect(transaction).not.toHaveBeenCalled();
});
it("allows independent moderator decisions and audits them", async () => {
  await reviewVenture(db, { id: "moderator", role: "MODERATOR" }, input);
  expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ metadata: { operation: "review", selfReview: false, reviewerRole: "MODERATOR" } }) });
});
it.each(["SUSPENDED", "PUBLISHED", "ARCHIVED"])("does not let admins publish %s ventures", async status => {
  tx.communityVenture.findUnique.mockResolvedValue({ id: "venture", ownerId: "owner", status, revision: 2 });
  await expect(reviewVenture(db, { id: "owner", role: "ADMIN" }, input)).rejects.toThrow("changé");
  expect(tx.communityVenture.updateMany).not.toHaveBeenCalled();
});
it("does not audit or accept a stale decision", async () => {
  tx.communityVenture.updateMany.mockResolvedValue({ count: 0 });
  await expect(reviewVenture(db, { id: "owner", role: "ADMIN" }, input)).rejects.toThrow("mise à jour");
  expect(tx.auditLog.create).not.toHaveBeenCalled();
});
