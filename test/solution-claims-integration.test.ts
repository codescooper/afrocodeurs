import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
vi.mock("server-only", () => ({}));
import { reviewSolutionClaim } from "../features/solutions/claim-service";

const url = process.env.CONSTELLATION_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/constellation_test") throw new Error("Use only isolated constellation_test");
}
const db = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

describe.skipIf(!db)("Atlas PostgreSQL claims", () => {
  const users: string[] = [];
  let solutionId: string;
  beforeAll(async () => {
    for (let i = 0; i < 4; i++) users.push((await db!.user.create({ data: { email: `${randomUUID()}@example.test`, username: `atlas_${randomUUID().slice(0, 8)}`, role: i === 0 ? "ADMIN" : "USER", emailVerified: new Date() } })).id);
    solutionId = (await db!.solution.create({ data: { name: "Solution isolée", slug: randomUUID(), description: "Tests isolés du catalogue", type: "SOFTWARE", createdById: users[3] } })).id;
  });
  afterAll(async () => {
    if (solutionId) { await db!.auditLog.deleteMany({ where: { entityId: solutionId } }); await db!.solution.delete({ where: { id: solutionId } }); }
    await db!.user.deleteMany({ where: { id: { in: users } } });
    await db!.$disconnect();
  });
  it("never gives the referencing member implicit maintenance rights", async () => {
    expect(await db!.solutionMaintainer.count({ where: { solutionId } })).toBe(0);
    expect((await db!.solution.findUniqueOrThrow({ where: { id: solutionId } })).licenseVerified).toBe(false);
  });
  it("allows only one concurrent decision and keeps multiple verified maintainers", async () => {
    const claim = await db!.solutionClaim.create({ data: { solutionId, userId: users[1], evidence: "Code temporaire examiné dans le dépôt officiel de test." } });
    const input = { id: claim.id, status: "APPROVED" as const, note: "Contrôle du dépôt officiel vérifié manuellement." };
    const decisions = await Promise.allSettled([reviewSolutionClaim(db!, { id: users[0], role: "ADMIN" }, input), reviewSolutionClaim(db!, { id: users[0], role: "ADMIN" }, input)]);
    expect(decisions.filter(item => item.status === "fulfilled")).toHaveLength(1);
    expect(await db!.auditLog.count({ where: { entityId: solutionId } })).toBe(1);
    const second = await db!.solutionClaim.create({ data: { solutionId, userId: users[2], evidence: "Autre mainteneur dont les accès ont été vérifiés." } });
    await reviewSolutionClaim(db!, { id: users[0], role: "ADMIN" }, { ...input, id: second.id });
    expect(await db!.solutionMaintainer.count({ where: { solutionId } })).toBe(2);
  });
});
