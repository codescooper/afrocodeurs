import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), presence: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { user: { findMany: mocks.find }, chatPresence: { upsert: mocks.presence } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.limit }));
import { GET } from "../app/api/messages/contacts/route";
import { POST } from "../app/api/messages/presence/route";
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { id: "me" } }); mocks.limit.mockReturnValue({ ok: true }); });
it("requires authentication to list presence or heartbeat", async () => {
  mocks.auth.mockResolvedValue(null);
  expect((await GET(new Request("https://example.org/api/messages/contacts"))).status).toBe(401);
  expect((await POST(new Request("https://example.org/api/messages/presence", { method: "POST" }))).status).toBe(401);
  expect(mocks.find).not.toHaveBeenCalled();
});
it("returns online/offline labels without exposing emails or exact activity timestamps", async () => {
  mocks.find.mockResolvedValueOnce([{ id: "a", username: "awa", name: "Awa", image: null, chatPresence: { lastSeen: new Date() } }]).mockResolvedValueOnce([{ id: "b", username: "baba", name: null, image: null, chatPresence: null }]);
  const data = await (await GET(new Request("https://example.org/api/messages/contacts?q=ab"))).json();
  expect(data.online[0].online).toBe(true);
  expect(data.offline[0].online).toBe(false);
  expect(data.online[0]).not.toHaveProperty("lastSeen");
  expect(data.online[0]).not.toHaveProperty("email");
  expect(mocks.find.mock.calls[0][0].where).toMatchObject({ id: { not: "me" }, emailVerified: { not: null } });
});
it("paginates offline members without repeating online members", async () => {
  mocks.find.mockResolvedValue(Array.from({ length: 31 }, (_, i) => ({ id: String(i), username: `user${i}`, chatPresence: null })));
  const data = await (await GET(new Request("https://example.org/api/messages/contacts?offset=30"))).json();
  expect(data.online).toEqual([]);
  expect(data.offline).toHaveLength(30);
  expect(data.nextOffset).toBe(60);
  expect(mocks.find.mock.calls[0][0].skip).toBe(30);
});
it("records only the authenticated user's presence and rejects simple cross-site form posts", async () => {
  expect((await POST(new Request("https://example.org/api/messages/presence", { method: "POST" }))).status).toBe(415);
  const response = await POST(new Request("https://example.org/api/messages/presence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: "someone-else" }) }));
  expect(response.status).toBe(200);
  expect(mocks.presence.mock.calls[0][0].where).toEqual({ userId: "me" });
});
