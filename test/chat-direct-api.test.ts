import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), find: vi.fn(), start: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/guard", () => ({ guard: mocks.guard }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.find } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.limit }));
vi.mock("@/features/messaging/direct-conversation", () => ({ ensureDirectConversation: mocks.start }));
import { POST } from "../app/api/messages/direct/route";
const request = (recipientId: string) => new Request("https://example.org/api/messages/direct", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId }) });
beforeEach(() => { vi.resetAllMocks(); mocks.guard.mockResolvedValue({ ok: true, user: { id: "me" } }); mocks.limit.mockReturnValue({ ok: true }); });
it("requires a verified sender", async () => {
  mocks.guard.mockResolvedValue({ ok: false, error: "Compte vérifié requis." });
  expect((await POST(request("other"))).status).toBe(401);
  expect(mocks.start).not.toHaveBeenCalled();
});
it("can open an offline member's conversation without sending a message", async () => {
  mocks.find.mockResolvedValue({ id: "other", username: "awa", name: "Awa", image: null, emailVerified: new Date() });
  mocks.start.mockResolvedValue({ id: "conversation" });
  const response = await POST(request("other"));
  expect(response.status).toBe(200);
  expect((await response.json()).conversation.id).toBe("conversation");
  expect(mocks.start).toHaveBeenCalledWith("me", "other");
});
it("rejects self conversations and unavailable recipients", async () => {
  expect((await POST(request("me"))).status).toBe(400);
  mocks.find.mockResolvedValue(null);
  expect((await POST(request("missing"))).status).toBe(404);
  expect(mocks.start).not.toHaveBeenCalled();
});
