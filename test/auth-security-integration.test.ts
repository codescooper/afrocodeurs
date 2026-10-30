import { createHash, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
vi.mock("server-only", () => ({}));
import { consumeCredentialAttempt } from "../lib/credential-rate-limit";
const url = process.env.CONSTELLATION_TEST_DATABASE_URL;
if (url) {
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/constellation_test") throw new Error("Only isolated local constellation_test is allowed");
}
const clients = url ? [0,1].map(() => new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })) : [];
const keys: string[] = [];
const email = () => { const value = `security_${randomUUID()}@example.test`; keys.push(createHash("sha256").update(value).digest("hex")); return value; };
describe.skipIf(!url)("credential quota on PostgreSQL", () => {
  afterAll(async () => {
    if (clients[0]) await clients[0].authRateLimit.deleteMany({ where: { key: { in: keys } } });
    await Promise.all(clients.map(client => client.$disconnect()));
  });
  it("admits exactly ten concurrent attempts across independent clients", async () => {
    const value = email();
    const results = await Promise.all(Array.from({ length: 30 }, (_, i) => consumeCredentialAttempt(value, clients[i % 2])));
    expect(results.filter(Boolean)).toHaveLength(10);
    expect((await clients[0].authRateLimit.findUniqueOrThrow({ where: { key: keys.at(-1)! } })).count).toBe(10);
  });
  it("shares the quota across email case variants and resets only after expiry", async () => {
    const value = email();
    for (let i = 0; i < 10; i++) expect(await consumeCredentialAttempt(i % 2 ? value.toUpperCase() : value, clients[i % 2])).toBe(true);
    expect(await consumeCredentialAttempt(value, clients[1])).toBe(false);
    await clients[0].authRateLimit.update({ where: { key: keys.at(-1)! }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await consumeCredentialAttempt(value, clients[1])).toBe(true);
    expect((await clients[0].authRateLimit.findUniqueOrThrow({ where: { key: keys.at(-1)! } })).count).toBe(1);
  });
});
