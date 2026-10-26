import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
vi.mock("server-only", () => ({}));
import { inviteSolutionManager, removeSolutionManager, respondSolutionInvitation } from "../features/solutions/team-service";

const url = process.env.CONSTELLATION_TEST_DATABASE_URL;
if (url) { const parsed = new URL(url); if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/constellation_test") throw new Error("Use only isolated constellation_test"); }
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

describe.skipIf(!db)("Atlas team PostgreSQL", () => {
  const users: { id: string; username: string; role: "USER" | "ADMIN" }[] = [];
  let solutionId: string;
  beforeAll(async () => {
    for (let i = 0; i < 4; i++) {
      const data = { email: `${randomUUID()}@example.test`, username: `team_${randomUUID().slice(0, 8)}`, role: i === 3 ? "ADMIN" as const : "USER" as const, emailVerified: new Date() };
      const user = await db!.user.create({ data }); users.push({ id: user.id, username: user.username, role: data.role });
    }
    solutionId = (await db!.solution.create({ data: { name: "Team test", slug: randomUUID(), description: "Isolated QA", type: "SOFTWARE", createdById: users[0].id } })).id;
    await db!.solutionMaintainer.create({ data: { solutionId, userId: users[0].id } });
  });
  afterAll(async () => {
    if (solutionId) { await db!.auditLog.deleteMany({ where: { entityId: solutionId } }); await db!.solution.delete({ where: { id: solutionId } }); }
    await db!.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } }); await db!.$disconnect();
  });
  it("denies stranger invitations and prevents abandoning the last access", async () => {
    await expect(inviteSolutionManager(db!, users[2], { solutionId, username: users[1].username, kind: "COLLABORATE" })).rejects.toThrow("gestionnaires");
    await expect(removeSolutionManager(db!, users[0], { solutionId, userId: users[0].id, note: "Je quitte la gestion de cette fiche." })).rejects.toThrow("au moins un");
  });
  it("requires recipient consent, rejects strangers and handles concurrent responses once", async () => {
    await inviteSolutionManager(db!, users[0], { solutionId, username: users[1].username, kind: "COLLABORATE" });
    expect(await db!.solutionMaintainer.count({ where: { solutionId } })).toBe(1);
    const invite = await db!.solutionInvitation.findFirstOrThrow({ where: { solutionId, status: "PENDING" } });
    await expect(respondSolutionInvitation(db!, users[2], { id: invite.id, decision: "ACCEPT" })).rejects.toThrow("appartient pas");
    const outcomes = await Promise.allSettled([respondSolutionInvitation(db!, users[1], { id: invite.id, decision: "ACCEPT" }), respondSolutionInvitation(db!, users[1], { id: invite.id, decision: "ACCEPT" })]);
    expect(outcomes.filter(item => item.status === "fulfilled")).toHaveLength(1);
    expect(await db!.solutionMaintainer.count({ where: { solutionId } })).toBe(2);
  });
  it("transfers only after acceptance and preserves other managers", async () => {
    await inviteSolutionManager(db!, users[0], { solutionId, username: users[2].username, kind: "TRANSFER" });
    expect(await db!.solutionMaintainer.count({ where: { solutionId, userId: users[0].id } })).toBe(1);
    const invite = await db!.solutionInvitation.findFirstOrThrow({ where: { solutionId, status: "PENDING", kind: "TRANSFER" } });
    await respondSolutionInvitation(db!, users[2], { id: invite.id, decision: "ACCEPT" });
    expect(await db!.solutionMaintainer.count({ where: { solutionId, userId: users[0].id } })).toBe(0);
    expect(await db!.solutionMaintainer.count({ where: { solutionId } })).toBe(2);
  });
  it("does not let one manager evict another but allows reasoned admin revocation", async () => {
    await expect(removeSolutionManager(db!, users[1], { solutionId, userId: users[2].id, note: "Retrait non autorisé de cet accès." })).rejects.toThrow("administrateur");
    await removeSolutionManager(db!, users[3], { solutionId, userId: users[2].id, note: "Accès retiré suite à une vérification de l’équipe." });
    expect(await db!.solutionMaintainer.count({ where: { solutionId } })).toBe(1);
  });
  it("rejects expired invitations and cancelled invitations", async () => {
    await inviteSolutionManager(db!, users[1], { solutionId, username: users[0].username, kind: "COLLABORATE" });
    const invite = await db!.solutionInvitation.findFirstOrThrow({ where: { solutionId, status: "PENDING" } });
    await db!.solutionInvitation.update({ where: { id: invite.id }, data: { expiresAt: new Date(0) } });
    await expect(respondSolutionInvitation(db!, users[0], { id: invite.id, decision: "ACCEPT" })).rejects.toThrow("expiré");
    await respondSolutionInvitation(db!, users[1], { id: invite.id, decision: "CANCEL" });
    await expect(respondSolutionInvitation(db!, users[0], { id: invite.id, decision: "ACCEPT" })).rejects.toThrow("traitée");
  });
  it("does not honor invitations from a manager whose rights were removed", async () => {
    await inviteSolutionManager(db!, users[1], { solutionId, username: users[0].username, kind: "COLLABORATE" });
    const invite = await db!.solutionInvitation.findFirstOrThrow({ where: { solutionId, status: "PENDING" } });
    await db!.solutionMaintainer.deleteMany({ where: { solutionId, userId: users[1].id } });
    await expect(respondSolutionInvitation(db!, users[0], { id: invite.id, decision: "ACCEPT" })).rejects.toThrow("droits");
    expect(await db!.solutionMaintainer.count({ where: { solutionId } })).toBe(0);
  });
});
