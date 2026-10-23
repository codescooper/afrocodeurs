import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ member: vi.fn(), communityMember: vi.fn(), conversation: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "me" } }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); }, notFound: () => { throw new Error("not-found"); } }));
vi.mock("@/lib/db", () => ({ db: { conversationMember: { findUnique: mocks.member }, communityMember: { findUnique: mocks.communityMember }, conversation: { findUnique: mocks.conversation } } }));
vi.mock("@/features/messaging/chat-room", () => ({ ChatRoom: () => null }));
vi.mock("@/features/messaging/actions", () => ({ leaveConversationAction: vi.fn() }));
import ConversationPage from "../app/(public)/messages/[id]/page";
beforeEach(() => { vi.resetAllMocks(); mocks.member.mockResolvedValue(null); mocks.conversation.mockResolvedValue({ type: "GROUP", community: { id: "community", slug: "dakar" } }); });
it("redirects an old community-chat URL to the accessible community salon", async () => {
  mocks.communityMember.mockResolvedValue({ id: "membership" });
  await expect(ConversationPage({ params: Promise.resolve({ id: "community-chat-old" }) })).rejects.toThrow("redirect:/communities/dakar#chat");
});
it("does not expose a community salon to a nonmember", async () => {
  mocks.communityMember.mockResolvedValue(null);
  await expect(ConversationPage({ params: Promise.resolve({ id: "community-chat-old" }) })).rejects.toThrow("not-found");
});
it("does not trust a stale direct membership for a community conversation", async () => {
  mocks.member.mockResolvedValue({ conversation: { communityId: "community", type: "GROUP" } });
  mocks.communityMember.mockResolvedValue(null);
  await expect(ConversationPage({ params: Promise.resolve({ id: "community-chat-old" }) })).rejects.toThrow("not-found");
});
