import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "@prisma/client";
import { canTransition, mentorshipSchema } from "../features/mentorship/validators";
vi.mock("server-only", () => ({}));
vi.mock("@/features/notifications/push", () => ({ sendPush: vi.fn(async () => {}) }));
import { runMentorship } from "../features/mentorship/service";

const tx = {
  mentorshipOffer: { findUnique: vi.fn(), upsert: vi.fn() },
  mentorshipRequest: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  mentorshipBlock: { findFirst: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  user: { findUnique: vi.fn() }, notification: { create: vi.fn() },
};
const transaction = vi.fn();
const db = { $transaction: transaction } as unknown as PrismaClient;
const offer = { id: "o", mentorId: "mentor", active: true, suspendedAt: null, capacity: 1, mentor: { emailVerified: new Date() } };
beforeEach(() => {
  vi.resetAllMocks();
  transaction.mockImplementation((callback) => callback(tx));
  tx.mentorshipOffer.findUnique.mockResolvedValue(offer);
  tx.mentorshipBlock.findFirst.mockResolvedValue(null);
  tx.mentorshipRequest.count.mockResolvedValue(0);
  tx.mentorshipRequest.findUnique.mockResolvedValue(null);
  tx.mentorshipRequest.updateMany.mockResolvedValue({ count: 1 });
  tx.user.findUnique.mockResolvedValue({ id: "other", notificationOptOut: [] });
});
describe("mentorship validation", () => {
  it("normalizes and deduplicates topics", () => {
    const result = mentorshipSchema.parse({ command: "offer", title: "Apprendre React", description: "Un accompagnement concret pour ton premier projet web.", topics: "React, react, TypeScript", languages: "français", availability: "Samedi 10h UTC", capacity: "2", active: true });
    expect(result).toMatchObject({ topics: ["react", "typescript"], capacity: 2 });
  });
  it("rejects a short request or arbitrary status", () => {
    expect(mentorshipSchema.safeParse({ command: "request", id: "o", message: "salut" }).success).toBe(false);
    expect(mentorshipSchema.safeParse({ command: "respond", id: "r", status: "ADMIN" }).success).toBe(false);
  });
  it.each(["DECLINED", "CANCELLED", "COMPLETED"])("keeps %s terminal", (status) => {
    for (const next of ["ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"]) expect(canTransition(status, next, true)).toBe(false);
  });
  it("only lets a mentor accept, decline or complete", () => {
    expect(canTransition("PENDING", "ACCEPTED", false)).toBe(false);
    expect(canTransition("PENDING", "ACCEPTED", true)).toBe(true);
    expect(canTransition("ACCEPTED", "COMPLETED", true)).toBe(true);
    expect(canTransition("ACCEPTED", "CANCELLED", false)).toBe(true);
  });
});
describe("mentorship transactions", () => {
  it("rejects self requests and blocked pairs", async () => {
    await expect(runMentorship(db, "mentor", { command: "request", id: "o", message: "x" })).rejects.toThrow("propre offre");
    tx.mentorshipBlock.findFirst.mockResolvedValue({ id: "block" });
    await expect(runMentorship(db, "learner", { command: "request", id: "o", message: "x" })).rejects.toThrow("pas disponible");
    expect(tx.mentorshipRequest.create).not.toHaveBeenCalled();
  });
  it("rejects paused, moderated and unverified mentor offers", async () => {
    for (const change of [{ active: false }, { suspendedAt: new Date() }, { mentor: { emailVerified: null } }]) {
      tx.mentorshipOffer.findUnique.mockResolvedValue({ ...offer, ...change });
      await expect(runMentorship(db, "learner", { command: "request", id: "o", message: "x" })).rejects.toThrow("plus disponible");
    }
  });
  it("enforces capacity before creating a request", async () => {
    tx.mentorshipRequest.count.mockResolvedValue(1);
    await expect(runMentorship(db, "learner", { command: "request", id: "o", message: "x" })).rejects.toThrow("places");
  });
  it("commits the notification alongside the request without its private message", async () => {
    await runMentorship(db, "learner", { command: "request", id: "o", message: "private goal" });
    expect(tx.notification.create).toHaveBeenCalledOnce();
    expect(JSON.stringify(tx.notification.create.mock.calls)).not.toContain("private goal");
    expect(transaction.mock.calls[0][1]).toEqual({ isolationLevel: "Serializable" });
  });
  it("respects social notification opt-out", async () => {
    tx.user.findUnique.mockResolvedValue({ notificationOptOut: ["SOCIAL"] });
    await runMentorship(db, "learner", { command: "request", id: "o", message: "private" });
    expect(tx.notification.create).not.toHaveBeenCalled();
  });
  it("refuses unrelated users and learner acceptance", async () => {
    tx.mentorshipRequest.findUnique.mockResolvedValue({ id: "r", menteeId: "learner", status: "PENDING", offerId: "o", offer });
    for (const id of ["stranger", "learner"]) await expect(runMentorship(db, id, { command: "respond", id: "r", status: "ACCEPTED" })).rejects.toThrow();
    expect(tx.mentorshipRequest.updateMany).not.toHaveBeenCalled();
  });
  it("rechecks capacity on acceptance", async () => {
    tx.mentorshipRequest.findUnique.mockResolvedValue({ id: "r", menteeId: "learner", status: "PENDING", offerId: "o", offer });
    tx.mentorshipRequest.count.mockResolvedValue(1);
    await expect(runMentorship(db, "mentor", { command: "respond", id: "r", status: "ACCEPTED" })).rejects.toThrow("places");
  });
  it("blocks and cancels active relationships in both directions", async () => {
    await runMentorship(db, "learner", { command: "block", id: "mentor" });
    expect(tx.mentorshipBlock.upsert).toHaveBeenCalledOnce();
    expect(tx.mentorshipRequest.updateMany.mock.calls[0][0]).toMatchObject({ data: { status: "CANCELLED" }, where: { OR: expect.any(Array) } });
  });
  it("does not restore cancelled requests when unblocking", async () => {
    await runMentorship(db, "learner", { command: "unblock", id: "mentor" });
    expect(tx.mentorshipRequest.updateMany).not.toHaveBeenCalled();
    expect(tx.mentorshipBlock.deleteMany).toHaveBeenCalledWith({ where: { blockerId: "learner", blockedId: "mentor" } });
  });
  it("retries serialization conflicts at most three times", async () => {
    transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "test" }));
    await expect(runMentorship(db, "learner", { command: "block", id: "mentor" })).rejects.toThrow();
    expect(transaction).toHaveBeenCalledTimes(3);
  });
});
