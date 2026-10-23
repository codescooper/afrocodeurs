import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), direct: vi.fn(), communities: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { conversation: { upsert: async () => ({ id: "general", updatedAt: new Date() }) }, conversationMember: { findMany: mocks.direct }, communityMember: { findMany: mocks.communities }, message: { count: mocks.count } } }));
import { GET } from "../app/api/messages/summary/route";
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { id: "me", isEmailVerified: true } }); mocks.count.mockResolvedValue(0); });
it("returns recent messages with DB avatars and canonical community links", async () => {
  mocks.direct.mockResolvedValue([{ lastReadAt: new Date(0), conversation: { id: "direct", type: "DIRECT", title: null, updatedAt: new Date("2026-10-23"), members: [{ user: { name: "Awa", image: "/uploads/awa.png" } }], messages: [{ body: "Bonjour", createdAt: new Date("2026-10-20") }] } }]);
  mocks.communities.mockResolvedValue([{ chatLastReadAt: new Date(0), community: { slug: "dakar", name: "Dakar", chat: { id: "community-chat-1", updatedAt: new Date("2026-10-20"), messages: [{ body: "Bienvenue", createdAt: new Date("2026-10-22") }] } } }]);
  const result = await (await GET()).json();
  expect(result.conversations.map((item: { id: string }) => item.id)).toEqual(["community-chat-1", "direct"]);
  expect(result.conversations[0].href).toBe("/communities/dakar#chat");
  expect(result.conversations[1].image).toBe("/uploads/awa.png");
  expect(mocks.direct.mock.calls[0][0].where).toMatchObject({ userId: "me", conversation: { communityId: null, messages: { some: { deletedAt: null } } } });
  expect(mocks.communities.mock.calls[0][0].where.userId).toBe("me");
});
it("does not query member data for an anonymous visitor", async () => {
  mocks.auth.mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect(mocks.direct).not.toHaveBeenCalled();
});
