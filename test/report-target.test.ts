import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn(), cancel: vi.fn(), venture: vi.fn(), collaborations: vi.fn(), transaction: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {
  mentorshipRequest: { findUnique: mocks.request, updateMany: mocks.cancel },
  communityVenture: { updateMany: mocks.venture },
  ventureCollaboration: { updateMany: mocks.collaborations },
  $transaction: mocks.transaction,
} }));
import { hideTarget, resolveReportTarget } from "../features/admin/report-target";

beforeEach(() => vi.resetAllMocks());
it("resolves a mentorship request independently from Constellation", async () => {
  mocks.request.mockResolvedValue({ offer: { title: "Apprendre ensemble" }, mentee: { username: "awa" }, message: "Objectif prive", menteeId: "member" });
  expect(await resolveReportTarget("MENTORSHIP_REQUEST", "request")).toMatchObject({ title: "Apprendre ensemble", snippet: "Objectif prive", authorId: "member" });
});
it("cancels only the reported mentorship request", async () => {
  await hideTarget("MENTORSHIP_REQUEST", "request");
  expect(mocks.cancel).toHaveBeenCalledWith({ where: { id: "request", status: { in: ["PENDING", "ACCEPTED"] } }, data: { status: "CANCELLED" } });
  expect(mocks.venture).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("keeps the independent Constellation suspension path", async () => {
  await hideTarget("COMMUNITY_VENTURE", "venture");
  expect(mocks.venture).toHaveBeenCalledWith({ where: { id: "venture" }, data: { status: "SUSPENDED", revision: { increment: 1 } } });
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.cancel).not.toHaveBeenCalled();
});
