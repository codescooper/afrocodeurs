import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), community: vi.fn(), list: vi.fn(), groups: vi.fn(), messages: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: { community: { findUnique: mocks.community, findMany: mocks.list, groupBy: mocks.groups }, message: { findMany: mocks.messages } } }));
vi.mock("@/features/reputation/queries", () => ({ getLeaderboard: async () => [] }));
vi.mock("server-only", () => ({}));
import CommunityPage from "../app/(public)/communities/[slug]/page";
import CommunitiesPage from "../app/(public)/communities/page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(null);
  mocks.community.mockResolvedValue({ id: "community", slug: "abidjan", name: "Abidjan", type: "LOCAL", description: "Communauté", members: [{ userId: "member", role: "MEMBER", user: { username: "awa", name: "Awa", image: null } }], knowledge: [], problems: [], questions: [], chat: { id: "community-chat" } });
  mocks.list.mockResolvedValue([]);
  mocks.groups.mockResolvedValue([]);
  mocks.messages.mockResolvedValue([]);
});

it("renders public community information without reading private chat messages", async () => {
  await CommunityPage({ params: Promise.resolve({ slug: "abidjan" }) });
  expect(mocks.community).toHaveBeenCalled();
  expect(mocks.messages).not.toHaveBeenCalled();
  expect(mocks.community.mock.calls[0][0].include.chat).toEqual({ select: { id: true } });
});

it.each([
  ["stranger", true, false],
  ["member", false, false],
  ["member", true, true],
])("restricts chat loading for %s verified=%s", async (id, verified, allowed) => {
  mocks.auth.mockResolvedValue({ user: { id, role: "USER", isEmailVerified: verified } });
  await CommunityPage({ params: Promise.resolve({ slug: "abidjan" }) });
  expect(mocks.messages.mock.calls.length).toBe(allowed ? 1 : 0);
  if (allowed) expect(mocks.messages).toHaveBeenCalledWith(expect.objectContaining({ where: { conversationId: "community-chat", deletedAt: null } }));
});

it("does not pass an invalid crawler filter to the PostgreSQL enum", async () => {
  await CommunitiesPage({ searchParams: Promise.resolve({ type: "INVALID" }) });
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
});
