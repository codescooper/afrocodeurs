import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), run: vi.fn(), limit: vi.fn(), findRequest: vi.fn(), findOffer: vi.fn(), report: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({}));
vi.mock("@/lib/guard", () => ({ guard: mocks.guard, invalidMessage: () => "Données invalides." }));
vi.mock("@/lib/db", () => ({ db: { mentorshipRequest: { findFirst: mocks.findRequest }, mentorshipOffer: { findFirst: mocks.findOffer }, report: { create: mocks.report } } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.limit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/mentorship/service", () => ({ runMentorship: mocks.run, MentorshipError: class extends Error {} }));
vi.mock("@/features/notifications/notify", () => ({ notify: vi.fn() }));
import { mentorshipAction } from "../features/mentorship/actions";
import { createReportAction } from "../features/admin/actions";
const form = (values: Record<string, string>) => {
  const result = new FormData(); Object.entries(values).forEach(([key, value]) => result.set(key, value)); return result;
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ ok: true, user: { id: "viewer" } });
  mocks.limit.mockReturnValue({ ok: true });
});
describe("mentorship action boundaries", () => {
  it("requires verified email for a request", async () => {
    await mentorshipAction(undefined, form({ command: "request", id: "offer", message: "Un objectif suffisamment detaille pour cette demande." }));
    expect(mocks.guard).toHaveBeenCalledWith({ verified: true });
  });
  it("allows unverified users to cancel or block without losing control of their relationships", async () => {
    await mentorshipAction(undefined, form({ command: "respond", id: "request", status: "CANCELLED" }));
    expect(mocks.guard).toHaveBeenLastCalledWith({ verified: false });
    await mentorshipAction(undefined, form({ command: "block", id: "mentor" }));
    expect(mocks.guard).toHaveBeenLastCalledWith({ verified: false });
  });
  it("never trusts a submitted actor id", async () => {
    await mentorshipAction(undefined, form({ command: "block", id: "mentor", userId: "admin" }));
    expect(mocks.run.mock.calls[0][1]).toBe("viewer");
  });
  it("does not mutate after a failed guard or rate limit", async () => {
    mocks.guard.mockResolvedValueOnce({ ok: false, error: "Connexion requise" });
    await mentorshipAction(undefined, form({ command: "block", id: "mentor" }));
    mocks.limit.mockReturnValueOnce({ ok: false });
    await mentorshipAction(undefined, form({ command: "block", id: "mentor" }));
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it("does not let strangers report private requests", async () => {
    mocks.findRequest.mockResolvedValue(null);
    expect(await createReportAction(undefined, form({ targetType: "MENTORSHIP_REQUEST", targetId: "private", reason: "SPAM" }))).toEqual({ error: "Cible invalide." });
    expect(mocks.findRequest).toHaveBeenCalledWith({ where: { id: "private", OR: [{ menteeId: "viewer" }, { offer: { mentorId: "viewer" } }] }, select: { id: true } });
    expect(mocks.report).not.toHaveBeenCalled();
  });
  it("allows a participant to report the private request", async () => {
    mocks.findRequest.mockResolvedValue({ id: "private" });
    expect(await createReportAction(undefined, form({ targetType: "MENTORSHIP_REQUEST", targetId: "private", reason: "SPAM" }))).toEqual({ success: true });
    expect(mocks.report).toHaveBeenCalledOnce();
  });
  it("allows reporting a paused offer only for its past applicant", async () => {
    mocks.findOffer.mockResolvedValue({ id: "offer" });
    await createReportAction(undefined, form({ targetType: "MENTORSHIP_OFFER", targetId: "offer", reason: "SPAM" }));
    expect(mocks.findOffer).toHaveBeenCalledWith({ where: { id: "offer", OR: [{ active: true, suspendedAt: null }, { requests: { some: { menteeId: "viewer" } } }] }, select: { id: true } });
    expect(mocks.report).toHaveBeenCalledOnce();
  });
});
