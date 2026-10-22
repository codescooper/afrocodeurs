import { beforeEach, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const mocks = vi.hoisted(() => ({ guard: vi.fn(), recipient: vi.fn(), find: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.recipient }, conversation: { findUnique: mocks.find, create: mocks.create } } }));
vi.mock("@/lib/guard", () => ({ guard: mocks.guard, invalidMessage: vi.fn() }));
vi.mock("@/features/notifications/notify", () => ({ notify: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import { startDirectConversationAction } from "../features/messaging/actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ ok: true, user: { id: "owner" } });
  mocks.recipient.mockResolvedValue({ id: "applicant" });
});
function form() { const data = new FormData(); data.set("recipientId", "applicant"); return data; }
it("opens the conversation created by the concurrent participant", async () => {
  mocks.find.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "shared" });
  mocks.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" }));
  await expect(startDirectConversationAction(form())).rejects.toThrow("REDIRECT:/messages/shared");
  expect(mocks.find).toHaveBeenLastCalledWith({ where: { directKey: "applicant:owner" }, select: { id: true } });
});
it("preserves unrelated database errors", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.create.mockRejectedValue(new Error("database unavailable"));
  await expect(startDirectConversationAction(form())).rejects.toThrow("database unavailable");
  expect(mocks.find).toHaveBeenCalledTimes(1);
});
it("does not hide a uniqueness failure without a matching conversation", async () => {
  mocks.find.mockResolvedValue(null);
  mocks.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" }));
  await expect(startDirectConversationAction(form())).rejects.toThrow("duplicate");
});
