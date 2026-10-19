import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
vi.mock("server-only", () => ({}));
vi.mock("@/features/notifications/push", () => ({ sendPush: vi.fn(async () => {}) }));
import { runMentorship } from "../features/mentorship/service";

const url = process.env.MENTORSHIP_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(parsed.hostname) || parsed.pathname !== "/mentorship_test") {
    throw new Error("Mentorship integration tests require the isolated local mentorship_test database");
  }
}
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;
describe.skipIf(!db)("mentorship PostgreSQL integration", () => {
  let mentor: string;
  let learner: string;
  let second: string;
  let offerId: string;
  let users: string[] = [];
  beforeEach(async () => {
    users = [];
    for (let i = 0; i < 3; i++) {
      const nonce = randomUUID();
      const user = await db!.user.create({ data: { email: `${nonce}@example.test`, username: `mt_${nonce.slice(0, 8)}`, emailVerified: new Date() } });
      users.push(user.id);
    }
    [mentor, learner, second] = users;
    await runMentorship(db!, mentor, { command: "offer", title: "Mentorat React", description: "Accompagnement autour du premier projet personnel.", topics: ["react"], languages: ["français"], availability: "Samedi 10h UTC", capacity: 1, active: true });
    offerId = (await db!.mentorshipOffer.findUniqueOrThrow({ where: { mentorId: mentor } })).id;
  });
  afterEach(async () => { await db!.user.deleteMany({ where: { id: { in: users } } }); });
  afterAll(async () => { await db?.$disconnect(); });
  const request = (userId: string) => runMentorship(db!, userId, { command: "request", id: offerId, message: "Je souhaite terminer mon premier projet React accessible." });
  it("persists a complete request/accept/complete cycle and atomic notifications", async () => {
    await request(learner);
    const row = await db!.mentorshipRequest.findUniqueOrThrow({ where: { offerId_menteeId: { offerId, menteeId: learner } } });
    await runMentorship(db!, mentor, { command: "respond", id: row.id, status: "ACCEPTED" });
    await runMentorship(db!, mentor, { command: "respond", id: row.id, status: "COMPLETED" });
    expect((await db!.mentorshipRequest.findUniqueOrThrow({ where: { id: row.id } })).status).toBe("COMPLETED");
    expect(await db!.notification.count({ where: { userId: { in: users } } })).toBe(3);
  });
  it("accepts only one concurrent decision for the last place", async () => {
    await request(learner); await request(second);
    const rows = await db!.mentorshipRequest.findMany({ where: { offerId } });
    const result = await Promise.allSettled(rows.map((row) => runMentorship(db!, mentor, { command: "respond", id: row.id, status: "ACCEPTED" })));
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db!.mentorshipRequest.count({ where: { offerId, status: "ACCEPTED" } })).toBe(1);
    expect(await db!.notification.count({ where: { userId: { in: users } } })).toBe(3);
  });
  it("does not duplicate concurrent requests or their notifications", async () => {
    const result = await Promise.allSettled([request(learner), request(learner)]);
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db!.mentorshipRequest.count({ where: { offerId } })).toBe(1);
    expect(await db!.notification.count({ where: { userId: mentor } })).toBe(1);
  });
  it("cancels an active relationship on block and prevents future requests", async () => {
    await request(learner);
    await runMentorship(db!, mentor, { command: "block", id: learner });
    expect((await db!.mentorshipRequest.findFirstOrThrow({ where: { offerId } })).status).toBe("CANCELLED");
    await expect(request(learner)).rejects.toThrow("pas disponible");
    await runMentorship(db!, learner, { command: "unblock", id: mentor });
    expect(await db!.mentorshipBlock.count({ where: { blockerId: mentor, blockedId: learner } })).toBe(1);
  });
  it("does not let the offer owner remove a moderation suspension", async () => {
    await db!.mentorshipOffer.update({ where: { id: offerId }, data: { active: false, suspendedAt: new Date() } });
    await runMentorship(db!, mentor, { command: "offer", title: "React encore", description: "Une nouvelle description suffisamment detaillee.", topics: ["react"], languages: ["français"], availability: "Samedi 10h UTC", capacity: 1, active: true });
    expect((await db!.mentorshipOffer.findUniqueOrThrow({ where: { id: offerId } })).suspendedAt).not.toBeNull();
    await expect(request(learner)).rejects.toThrow("plus disponible");
  });
  it("prevents unrelated users from changing a request", async () => {
    await request(learner);
    const row = await db!.mentorshipRequest.findFirstOrThrow({ where: { offerId } });
    await expect(runMentorship(db!, second, { command: "respond", id: row.id, status: "CANCELLED" })).rejects.toThrow("introuvable");
    expect((await db!.mentorshipRequest.findUniqueOrThrow({ where: { id: row.id } })).status).toBe("PENDING");
  });
});
