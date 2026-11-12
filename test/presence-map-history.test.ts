import { beforeEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), deleteMany: vi.fn(), cookies: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { presencePoint: mocks } }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
import { GET, DELETE } from "../app/api/presence/route";

beforeEach(() => { vi.clearAllMocks(); });

it("includes all retained points, even years old, without exposing identifiers", async () => {
  mocks.findMany.mockResolvedValue([
    { latitude: 5.5, longitude: -4, lastSeen: new Date("2020-01-01") },
    { latitude: 5.5, longitude: -4, lastSeen: new Date() },
    { latitude: 14.5, longitude: -17, lastSeen: new Date("2021-01-01") },
  ]);
  const response = await GET();
  expect(mocks.findMany).toHaveBeenCalledWith({ select: { latitude: true, longitude: true, lastSeen: true } });
  expect(await response.json()).toEqual({ points: [
    { latitude: 5.5, longitude: -4, active: 1, previous: 1 },
    { latitude: 14.5, longitude: -17, active: 0, previous: 1 },
  ] });
  expect(response.headers.get("cache-control")).toBe("no-store");
});

it("withdraws only the point associated with this browser cookie", async () => {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: "my-token" }) });
  const response = await DELETE();
  expect(mocks.deleteMany).toHaveBeenCalledWith({ where: {
    visitorKey: createHash("sha256").update("my-token").digest("hex"),
  } });
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
});

it("does not delete anyone's point when no cookie is available", async () => {
  mocks.cookies.mockResolvedValue({ get: () => undefined });
  expect((await DELETE()).status).toBe(200);
  expect(mocks.deleteMany).not.toHaveBeenCalled();
});
