import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ record: vi.fn(), findUser: vi.fn(), consume: vi.fn(), update: vi.fn(), updateMany: vi.fn(), compare: vi.fn(), hash: vi.fn(), signOut: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ signIn: vi.fn(), signOut: m.signOut }));
vi.mock("next-auth", async () => ({ AuthError: (await import("@auth/core/errors")).AuthError }));
vi.mock("@/lib/guard", () => ({ guard: async () => ({ ok: true, user: { id: "u" } }), invalidMessage: () => "invalid" }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ ok: true }), clientIp: async () => "test" }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: m.compare, hash: m.hash } }));
vi.mock("@/lib/db", () => ({ db: {
  verificationToken: { findUnique: m.record }, user: { findUnique: m.findUser },
  $transaction: async (work: (tx: unknown) => unknown) => work({ verificationToken: { deleteMany: m.consume }, user: { update: m.update, updateMany: m.updateMany } }),
} }));
import { resetPasswordAction } from "../features/auth/actions";
import { changePasswordAction } from "../features/settings/actions";
const token = "a".repeat(64);
function form(values: Record<string, string>) { const f = new FormData(); for (const [k,v] of Object.entries(values)) f.set(k,v); return f; }
beforeEach(() => {
  vi.clearAllMocks(); m.record.mockResolvedValue({ identifier: "reset:u@example.test", expires: new Date(Date.now()+60_000) });
  m.consume.mockResolvedValue({ count: 1 }); m.hash.mockResolvedValue("new-hash");
  m.findUser.mockResolvedValue({ passwordHash: "old-hash", email: "u@example.test" });
  m.compare.mockResolvedValue(true); m.updateMany.mockResolvedValue({ count: 1 });
  m.signOut.mockRejectedValue(new Error("REDIRECT"));
});
it("consumes the reset token and revokes all session versions in the same transaction", async () => {
  expect(await resetPasswordAction(undefined, form({ token, password: "new-password123" }))).toEqual({ done: true });
  expect(m.consume.mock.calls[0][0].where).toMatchObject({ token, identifier: "reset:u@example.test", expires: { gt: expect.any(Date) } });
  expect(m.update).toHaveBeenCalledWith({ where: { email: "u@example.test" }, data: { passwordHash: "new-hash", sessionVersion: { increment: 1 } } });
});
it("rejects token reuse or a concurrent consumption without changing a password", async () => {
  m.consume.mockResolvedValue({ count: 0 });
  expect(await resetPasswordAction(undefined, form({ token, password: "new-password123" }))).toHaveProperty("error");
  expect(m.update).not.toHaveBeenCalled();
});
it("rejects expired and malformed tokens", async () => {
  expect(await resetPasswordAction(undefined, form({ token: "bad", password: "new-password123" }))).toHaveProperty("error");
  expect(m.record).not.toHaveBeenCalled();
  m.record.mockResolvedValue({ identifier: "reset:u@example.test", expires: new Date(0) });
  expect(await resetPasswordAction(undefined, form({ token, password: "new-password123" }))).toHaveProperty("error");
  expect(m.hash).not.toHaveBeenCalled();
});
it("requires the old password, atomically updates its version and signs the current browser out", async () => {
  await expect(changePasswordAction(undefined, form({ currentPassword: "old-password", newPassword: "new-password123" }))).rejects.toThrow("REDIRECT");
  expect(m.updateMany).toHaveBeenCalledWith({ where: { id: "u", passwordHash: "old-hash" }, data: { passwordHash: "new-hash", sessionVersion: { increment: 1 } } });
  expect(m.consume).toHaveBeenCalledWith({ where: { identifier: "reset:u@example.test" } });
  expect(m.signOut).toHaveBeenCalledWith({ redirectTo: "/login?passwordChanged=1" });
});
it("does not update the password or revoke sessions on an incorrect current password", async () => {
  m.compare.mockResolvedValue(false);
  expect(await changePasswordAction(undefined, form({ currentPassword: "wrong-password", newPassword: "new-password123" }))).toHaveProperty("error");
  expect(m.updateMany).not.toHaveBeenCalled(); expect(m.signOut).not.toHaveBeenCalled();
});
it("rejects a stale concurrent password change", async () => {
  m.updateMany.mockResolvedValue({ count: 0 });
  expect(await changePasswordAction(undefined, form({ currentPassword: "old-password", newPassword: "new-password123" }))).toHaveProperty("error");
  expect(m.signOut).not.toHaveBeenCalled();
});
