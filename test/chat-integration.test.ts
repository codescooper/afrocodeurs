import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ userId: "" }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: state.userId, username: "qa", role: "USER", isEmailVerified: true } }) }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ ok: true }), clientIp: async () => "127.0.0.1" }));
vi.mock("@/features/notifications/push", () => ({ sendPush: vi.fn() }));
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const url = process.env.CONSTELLATION_TEST_DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/constellation_test") throw new Error("Use only the isolated local constellation_test database");
  }
  return { db: new PrismaClient({ adapter: new PrismaPg({ connectionString: url ?? "postgresql://test@127.0.0.1:9/constellation_test" }) }) };
});
import { db } from "@/lib/db";
import { GET as contacts } from "../app/api/messages/contacts/route";
import { POST as heartbeat } from "../app/api/messages/presence/route";
import { POST as direct } from "../app/api/messages/direct/route";
import { GET as read, POST as send } from "../app/api/messages/[id]/route";

afterAll(async () => db.$disconnect());
describe.skipIf(!process.env.CONSTELLATION_TEST_DATABASE_URL)("chat PostgreSQL", () => {
  it("lists offline contacts, opens their chat, delivers both ways and updates presence", async () => {
    const ids: string[] = [];
    let conversationId = "";
    const json = (path: string, body: unknown) => new Request(`https://example.org${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    try {
      for (const label of ["a", "b"]) {
        const key = `chat_${label}_${randomUUID().slice(0, 8)}`;
        ids.push((await db.user.create({ data: { email: `${key}@example.test`, username: key, emailVerified: new Date() } })).id);
      }
      state.userId = ids[0];
      const initial = await (await contacts(new Request("https://example.org/api/messages/contacts?q=chat_b_"))).json();
      expect(initial.offline.some((user: { id: string }) => user.id === ids[1])).toBe(true);
      const opened = await (await direct(json("/api/messages/direct", { recipientId: ids[1] }))).json();
      conversationId = opened.conversation.id;
      const params = { params: Promise.resolve({ id: conversationId }) };
      const first = await send(json(`/api/messages/${conversationId}`, { body: "A vers B hors ligne" }), params);
      expect(first.status).toBe(201);
      state.userId = ids[1];
      const received = await (await read(new Request(`https://example.org/api/messages/${conversationId}`), params)).json();
      expect(received.messages[0].body).toBe("A vers B hors ligne");
      expect((await heartbeat(json("/api/messages/presence", {}))).status).toBe(200);
      expect((await send(json(`/api/messages/${conversationId}`, { body: "B vers A" }), params)).status).toBe(201);
      state.userId = ids[0];
      const active = await (await contacts(new Request("https://example.org/api/messages/contacts?q=chat_b_"))).json();
      expect(active.online.some((user: { id: string }) => user.id === ids[1])).toBe(true);
      const reply = await (await read(new Request(`https://example.org/api/messages/${conversationId}?after=${encodeURIComponent(received.messages[0].createdAt)}`), params)).json();
      expect(reply.messages.some((message: { body: string }) => message.body === "B vers A")).toBe(true);
      await db.chatPresence.update({ where: { userId: ids[1] }, data: { lastSeen: new Date(Date.now() - 180000) } });
      const expired = await (await contacts(new Request("https://example.org/api/messages/contacts?q=chat_b_"))).json();
      expect(expired.offline.some((user: { id: string }) => user.id === ids[1])).toBe(true);
    } finally {
      if (conversationId) await db.conversation.deleteMany({ where: { id: conversationId } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    }
  });
});
