import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
vi.mock("server-only", () => ({}));
vi.mock("@/features/notifications/push", () => ({ sendPush: vi.fn(async () => {}) }));
import { saveVenture, reviewVenture, collaborate } from "../features/constellation/service";
import { ventureSchema } from "../features/constellation/validators";
import { ventureSearchWhere, ventureSearchText } from "../features/constellation/keywords";

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
  it("requires an independent reviewer except for admins", async () => {
    await expect(reviewVenture(db!, { id: owner, role: "USER" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" })).rejects.toThrow("modération");
    await expect(reviewVenture(db!, { id: owner, role: "MODERATOR" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" })).rejects.toThrow("autre personne");
  });
  it("allows an admin to publish their own pending venture and records the decision", async () => {
    await db!.user.update({ where: { id: owner }, data: { role: "ADMIN" } });
    await reviewVenture(db!, { id: owner, role: "ADMIN" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" });
    expect(await db!.communityVenture.findUnique({ where: { id: ventureId } })).toMatchObject({ status: "PUBLISHED", revision: 2 });
    expect(await db!.auditLog.findFirst({ where: { actorId: owner, entityId: ventureId, entityType: "COMMUNITY_VENTURE" } })).toMatchObject({ metadata: { operation: "review", selfReview: true, reviewerRole: "ADMIN" } });
    await expect(reviewVenture(db!, { id: owner, role: "ADMIN" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" })).rejects.toThrow("changé");
  });
  it("does not let admins bypass a suspension on their own venture", async () => {
    await db!.communityVenture.update({ where: { id: ventureId }, data: { status: "SUSPENDED" } });
    await expect(reviewVenture(db!, { id: owner, role: "ADMIN" }, { id: ventureId, revision: 1, status: "PUBLISHED", note: "" })).rejects.toThrow("changé");
  });
  it("rejects stale moderation after an owner edit", async () => {
    await saveVenture(db!, owner, { ...data(), id: ventureId, revision: 1 });
    await expect(publish()).rejects.toThrow("changé");
  });
  it("does not let someone else edit or link another member's open source project", async () => {
    await expect(saveVenture(db!, stranger, { ...data(), id: ventureId, revision: 1 })).rejects.toThrow("introuvable");
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
    await expect(collaborate(db!, applicant, { command: "respond", id: row.id, revision: row.revision, status: "ACCEPTED" })).rejects.toThrow("décision");
    await expect(collaborate(db!, stranger, { command: "respond", id: row.id, revision: row.revision, status: "CANCELLED" })).rejects.toThrow("introuvable");
    await collaborate(db!, owner, { command: "respond", id: row.id, revision: row.revision, status: "ACCEPTED" });
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
    await expect(saveVenture(db!, owner, { ...data(), id: ventureId, revision: 1 })).rejects.toThrow("suspendue");
  });
  it("respects Social opt-out and does not leak proposal messages in notifications", async () => {
    await publish();
    await db!.user.update({ where: { id: owner }, data: { notificationOptOut: ["SOCIAL"] } });
    await request();
    expect(await db!.notification.count({ where: { userId: owner, type: "VENTURE_REQUEST" } })).toBe(0);
    const all = await db!.notification.findMany({ where: { userId: { in: users } } });
    expect(JSON.stringify(all)).not.toContain("contribuer aux tests");
  });
  it("keeps published content and its search index until an edit is approved", async () => {
    await publish();
    const original = await db!.communityVenture.findUniqueOrThrow({ where: { id: ventureId } });
    const edited = { ...data(), id: ventureId, revision: original.revision, name: "Version confidentielle", needs: ["traduction"] };
    await saveVenture(db!, owner, edited);
    const pending = await db!.communityVenture.findUniqueOrThrow({ where: { id: ventureId } });
    expect(pending).toMatchObject({ status: "PUBLISHED", name: original.name, searchText: original.searchText, revision: 3 });
    expect(pending.pendingChanges).toMatchObject({ name: edited.name });
    expect(await db!.communityVenture.count({ where: { id: ventureId, ...ventureSearchWhere("confidentielle") } })).toBe(0);
    await reviewVenture(db!, { id: moderator, role: "MODERATOR" }, { id: ventureId, revision: 3, status: "PUBLISHED", note: "" });
    const approved = await db!.communityVenture.findUniqueOrThrow({ where: { id: ventureId } });
    expect(approved).toMatchObject({ status: "PUBLISHED", name: edited.name, pendingChanges: null, revision: 4 });
    expect(await db!.communityVenture.count({ where: { id: ventureId, ...ventureSearchWhere("confidentielle") } })).toBe(1);
  });
  it("rejects published edits without removing the existing public version", async () => {
    await publish();
    const original = await db!.communityVenture.findUniqueOrThrow({ where: { id: ventureId } });
    await saveVenture(db!, owner, { ...data(), id: ventureId, revision: 2, name: "Changement refusé" });
    await reviewVenture(db!, { id: moderator, role: "MODERATOR" }, { id: ventureId, revision: 3, status: "ARCHIVED", note: "Préciser les changements proposés." });
    expect(await db!.communityVenture.findUnique({ where: { id: ventureId } })).toMatchObject({ status: "PUBLISHED", name: original.name, pendingChanges: null, reviewNote: "Préciser les changements proposés." });
  });
  it("rejects stale and concurrent owner edits", async () => {
    const input = { ...data(), id: ventureId, revision: 1 };
    const results = await Promise.allSettled([saveVenture(db!, owner, input), saveVenture(db!, owner, { ...input, name: "Autre version" })]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    await expect(saveVenture(db!, owner, input)).rejects.toThrow("modifiée");
  });
  it("finds partial accent-insensitive terms from description and keywords", async () => {
    await saveVenture(db!, owner, { ...data(), id: ventureId, revision: 1, description: "Une plateforme pour les coopératives agricoles qui facilite les échanges, l’entraide et le développement des services locaux.", needs: ["développement web"] });
    for (const query of ["dev web", "coopérative", "cooperative", "DEVELOPPEMENT"]) {
      expect(await db!.communityVenture.count({ where: { id: ventureId, ...ventureSearchWhere(query) } })).toBe(1);
    }
    const source = "Éducation Œuvre Æther DÉVELOPPEMENT";
    const result = await db!.$queryRaw<{ value: string }[]>`SELECT trim(regexp_replace(replace(replace(replace(replace(lower(regexp_replace(normalize(${source}, NFD), U&'[\\0300-\\036f]', '', 'g')), 'œ', 'oe'), 'æ', 'ae'), 'Œ', 'oe'), 'Æ', 'ae'), '\\s+', ' ', 'g')) AS value`;
    expect(result[0].value).toBe(ventureSearchText({ name: source, summary: "", description: "", needs: [] }));
  });
  it("renews a terminal proposal while retaining history and rejecting stale decisions", async () => {
    await publish(); await request();
    const row = await db!.ventureCollaboration.findFirstOrThrow({ where: { ventureId } });
    await collaborate(db!, applicant, { command: "respond", id: row.id, revision: 1, status: "CANCELLED" });
    await expect(request()).rejects.toThrow("à partir");
    await db!.ventureCollaboration.update({ where: { id: row.id }, data: { updatedAt: new Date(Date.now() - 120000) } });
    await request();
    const renewed = await db!.ventureCollaboration.findUniqueOrThrow({ where: { id: row.id } });
    expect(renewed).toMatchObject({ status: "PENDING", revision: 3 });
    expect(renewed.history).toMatchObject([{ status: "CANCELLED", message: row.message }]);
    await expect(collaborate(db!, owner, { command: "respond", id: row.id, revision: 1, status: "ACCEPTED" })).rejects.toThrow("changé");
    expect(await db!.ventureCollaboration.count({ where: { ventureId } })).toBe(1);
  });
  it("enforces cooldown after refusal and respects blocking when renewing", async () => {
    await publish(); await request();
    const row = await db!.ventureCollaboration.findFirstOrThrow({ where: { ventureId } });
    await collaborate(db!, owner, { command: "respond", id: row.id, revision: row.revision, status: "DECLINED" });
    await expect(request()).rejects.toThrow("à partir");
    await db!.ventureCollaboration.update({ where: { id: row.id }, data: { updatedAt: new Date(Date.now() - 8 * 86400000) } });
    await collaborate(db!, owner, { command: "block", id: applicant });
    await expect(request()).rejects.toThrow("pas disponible");
    await collaborate(db!, owner, { command: "unblock", id: applicant });
    await request();
    expect(await db!.ventureCollaboration.findUnique({ where: { id: row.id } })).toMatchObject({ status: "PENDING" });
  });
});
