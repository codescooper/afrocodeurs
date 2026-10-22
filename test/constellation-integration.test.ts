import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
vi.mock("server-only", () => ({}));
vi.mock("@/features/notifications/push", () => ({ sendPush: vi.fn(async () => {}) }));
import { saveVenture, reviewVenture, collaborate } from "../features/constellation/service";
import { ventureSchema } from "../features/constellation/validators";

const url = process.env.CONSTELLATION_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/constellation_test") throw new Error("Use only the isolated local constellation_test database");
}
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;
describe.skipIf(!db)("Constellation PostgreSQL", () => {
  let owner: string, applicant: string, stranger: string, moderator: string, ventureId: string;
  let users: string[] = [];
  const data = () => ventureSchema.parse({ name: "Service de test", summary: "Un service communautaire déjà accessible sur le web.", description: "Un service de démonstration qui permet aux membres de présenter des réalisations concrètes, de trouver des partenaires et de faire évoluer leurs produits.", country: "CI", sector: "SERVICES", websiteUrl: `https://${randomUUID()}.example.org`, logoUrl: "", screenshots: "", needs: "design", openSourceProjectId: "", confirmed: "on" });
  beforeEach(async () => {
    users = [];
    for (let i = 0; i < 4; i++) {
      const nonce = randomUUID();
      users.push((await db!.user.create({ data: { email: `${nonce}@example.test`, username: `cv_${nonce.slice(0, 8)}`, emailVerified: new Date(), role: i === 3 ? "MODERATOR" : "USER" } })).id);
    }
    [owner, applicant, stranger, moderator] = users;
    await saveVenture(db!, owner, data());
    ventureId = (await db!.communityVenture.findFirstOrThrow({ where: { ownerId: owner } })).id;
  });
  afterEach(async () => { await db!.user.deleteMany({ where: { id: { in: users } } }); });
  afterAll(async () => { await db?.$disconnect(); });
  const publish = () => reviewVenture(db!, { id: moderator, role: "MODERATOR" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" });
  const request = () => collaborate(db!, applicant, { command: "request", id: ventureId, message: "Je peux contribuer aux tests et à l'accessibilité du service." });
  it("keeps pending ventures separate from open source projects", async () => {
    expect(await db!.project.count({ where: { createdById: owner } })).toBe(0);
    expect(await db!.communityVenture.count({ where: { ownerId: owner, status: "PUBLISHED" } })).toBe(0);
    await expect(request()).rejects.toThrow("pas disponible");
    await publish();
    expect(await db!.communityVenture.count({ where: { ownerId: owner, status: "PUBLISHED" } })).toBe(1);
  });
  it("requires an independent moderator", async () => {
    await expect(reviewVenture(db!, { id: owner, role: "USER" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" })).rejects.toThrow("modération");
    await expect(reviewVenture(db!, { id: owner, role: "MODERATOR" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" })).rejects.toThrow("autre personne");
  });
  it("rejects stale moderation after an owner edit", async () => {
    await saveVenture(db!, owner, { ...data(), id: ventureId });
    await expect(publish()).rejects.toThrow("changé");
  });
  it("does not let someone else edit or link another member's open source project", async () => {
    await expect(saveVenture(db!, stranger, { ...data(), id: ventureId })).rejects.toThrow("introuvable");
    const project = await db!.project.create({ data: { name: "Code test", slug: randomUUID(), githubRepo: "example/test", description: "Test", createdById: stranger } });
    try { await expect(saveVenture(db!, owner, { ...data(), id: ventureId, openSourceProjectId: project.id })).rejects.toThrow("tes projets"); }
    finally { await db!.project.delete({ where: { id: project.id } }); }
  });
  it("does not duplicate concurrent collaboration requests or notifications", async () => {
    await publish();
    const result = await Promise.allSettled([request(), request()]);
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await db!.ventureCollaboration.count({ where: { ventureId } })).toBe(1);
    expect(await db!.notification.count({ where: { userId: owner, type: "VENTURE_REQUEST" } })).toBe(1);
  });
  it("restricts decisions to the owner and cancellation to participants", async () => {
    await publish(); await request();
    const row = await db!.ventureCollaboration.findFirstOrThrow({ where: { ventureId } });
    await expect(collaborate(db!, applicant, { command: "respond", id: row.id, status: "ACCEPTED" })).rejects.toThrow("décision");
    await expect(collaborate(db!, stranger, { command: "respond", id: row.id, status: "CANCELLED" })).rejects.toThrow("introuvable");
    await collaborate(db!, owner, { command: "respond", id: row.id, status: "ACCEPTED" });
    expect((await db!.ventureCollaboration.findUniqueOrThrow({ where: { id: row.id } })).status).toBe("ACCEPTED");
    expect(await db!.notification.count({ where: { userId: applicant, type: "VENTURE_DECISION" } })).toBe(1);
  });
  it("blocks both directions without letting the other party undo it", async () => {
    await publish(); await request();
    await collaborate(db!, owner, { command: "block", id: applicant });
    expect((await db!.ventureCollaboration.findFirstOrThrow({ where: { ventureId } })).status).toBe("CANCELLED");
    await expect(request()).rejects.toThrow("pas disponible");
    await collaborate(db!, applicant, { command: "unblock", id: owner });
    expect(await db!.ventureBlock.count({ where: { blockerId: owner, blockedId: applicant } })).toBe(1);
  });
  it("does not clear a moderation suspension when saving", async () => {
    await db!.communityVenture.update({ where: { id: ventureId }, data: { status: "SUSPENDED" } });
    await expect(saveVenture(db!, owner, { ...data(), id: ventureId })).rejects.toThrow("suspendue");
  });
  it("respects Social opt-out and does not leak proposal messages in notifications", async () => {
    await publish();
    await db!.user.update({ where: { id: owner }, data: { notificationOptOut: ["SOCIAL"] } });
    await request();
    expect(await db!.notification.count({ where: { userId: owner, type: "VENTURE_REQUEST" } })).toBe(0);
    const all = await db!.notification.findMany({ where: { userId: { in: users } } });
    expect(JSON.stringify(all)).not.toContain("contribuer aux tests");
  });
});
