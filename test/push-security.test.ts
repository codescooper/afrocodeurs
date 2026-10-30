import { createECDH, randomBytes } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
const m = vi.hoisted(() => ({ lookup: vi.fn(), auth: vi.fn(), limit: vi.fn(), find: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), subs: vi.fn(), remove: vi.fn(), send: vi.fn(), raw: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("node:dns/promises", () => ({ lookup: m.lookup }));
vi.mock("@/lib/auth", () => ({ auth: m.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: m.limit }));
vi.mock("web-push", () => ({ default: { setVapidDetails: vi.fn(), sendNotification: m.send } }));
vi.mock("@/lib/db", () => ({ db: {
  pushSubscription: { findMany: m.subs, deleteMany: m.remove },
  $transaction: async (work: (tx: unknown) => unknown) => work({ $queryRaw: m.raw, pushSubscription: { findUnique: m.find, count: m.count, create: m.create, update: m.update } }),
} }));
import { allowedPushEndpoint, publicPushAddress, pushSubscriptionSchema, resolvePushAddress, pinnedPushAgent, readPushJson, withPushDeadline } from "../features/notifications/push-policy";
import { POST } from "../app/api/push/subscribe/route";
import { sendPush } from "../features/notifications/push";
const ecdh = createECDH("prime256v1"); ecdh.generateKeys();
const keys = { p256dh: ecdh.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") };
const endpoint = "https://fcm.googleapis.com/fcm/send/fixture";
const body = (url=endpoint) => ({ endpoint: url, keys });
const req = (value: unknown) => new Request("https://afrocodeurs.org/api/push/subscribe", { method: "POST", body: JSON.stringify(value) });
beforeEach(() => {
  vi.clearAllMocks(); m.lookup.mockResolvedValue([{ address: "142.250.74.202", family: 4 }]);
  m.auth.mockResolvedValue({ user: { id: "u" } }); m.limit.mockReturnValue({ ok: true }); m.count.mockResolvedValue(0); m.find.mockResolvedValue(null);
  m.subs.mockResolvedValue([]); m.send.mockResolvedValue({ statusCode: 201 }); m.remove.mockResolvedValue({ count: 1 });
});
it.each([endpoint, "https://updates.push.services.mozilla.com/wpush/v2/fixture", "https://web.push.apple.com/fixture", "https://wns2-fixture.notify.windows.com/w/?token=fixture"])("accepts supported provider %s", value => {
  expect(allowedPushEndpoint(value)).toBe(true); expect(pushSubscriptionSchema.safeParse(body(value)).success).toBe(true);
});
it.each(["https://127.0.0.1/", "https://[::1]/", "http://fcm.googleapis.com/x", "https://fcm.googleapis.com.evil.test/x", "https://evil.test/?next=fcm.googleapis.com", "https://fcm.googleapis.com:8443/x", "https://u:p@fcm.googleapis.com/x", "https://fcm.googleapis.com/x#fragment", "https://fcm.googleapis.com./x", " https://fcm.googleapis.com/x", "https://fcm.googleapis.com\\@evil.test/x"])("rejects unsafe/ambiguous endpoint %s before DNS", async value => {
  expect(allowedPushEndpoint(value)).toBe(false);
  expect((await POST(req(body(value)))).status).toBe(400); expect(m.lookup).not.toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
});
it.each(["127.0.0.1", "10.1.2.3", "169.254.169.254", "192.168.1.1", "172.16.0.1", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:db8::1", "2002:7f00:1::"])("rejects private/reserved address %s", address => expect(publicPushAddress(address)).toBe(false));
it("rejects private or mixed DNS answers for an otherwise allowed provider", async () => {
  m.lookup.mockResolvedValue([{ address: "142.250.74.202", family: 4 }, { address: "10.0.0.1", family: 4 }]);
  await expect(resolvePushAddress(endpoint)).rejects.toThrow("DNS");
  expect((await POST(req(body()))).status).toBe(400); expect(m.create).not.toHaveBeenCalled();
});
it("pins the checked address and preserves the requested TLS hostname", () => {
  const address = { address: "142.250.74.202", family: 4 };
  const agent = pinnedPushAgent(endpoint, address);
  const callback = vi.fn();
  agent.options.lookup!("fcm.googleapis.com", {}, callback);
  expect(callback).toHaveBeenCalledWith(null, address.address, 4);
  agent.options.lookup!("other.test", {}, callback);
  expect(callback.mock.calls.at(-1)?.[0]).toBeInstanceOf(Error); agent.destroy();
});
it("rejects invalid crypto keys and oversized streamed bodies without a database write", async () => {
  expect((await POST(req({ endpoint, keys: { p256dh: "x", auth: "x" } }))).status).toBe(400);
  expect(await readPushJson(req("x".repeat(9000)))).toBeNull(); expect(m.create).not.toHaveBeenCalled();
});
it("enforces authentication and rate limiting", async () => {
  m.auth.mockResolvedValue(null); expect((await POST(req(body()))).status).toBe(401);
  m.auth.mockResolvedValue({ user: { id: "u" } }); m.limit.mockReturnValue({ ok: false });
  expect((await POST(req(body()))).status).toBe(429); expect(m.create).not.toHaveBeenCalled();
});
it("locks the account quota, permits renewals and rejects foreign ownership", async () => {
  expect((await POST(req(body()))).status).toBe(200); expect(m.raw).toHaveBeenCalled();
  m.count.mockResolvedValue(5); expect((await POST(req(body()))).status).toBe(409);
  m.find.mockResolvedValue({ id: "s", userId: "u" }); expect((await POST(req(body()))).status).toBe(200);
  expect(m.update).toHaveBeenCalledWith({ where: { id: "s", userId: "u" }, data: keys });
  m.find.mockResolvedValue({ id: "s", userId: "other" }); expect((await POST(req(body()))).status).toBe(409);
});
it("handles a concurrent endpoint creation without transferring another account's subscription", async () => {
  m.create.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" }));
  expect((await POST(req(body()))).status).toBe(409); expect(m.update).not.toHaveBeenCalled();
});
it("revalidates legacy subscriptions on send, bounds timeout and destroys the pinned agent", async () => {
  vi.stubEnv("VAPID_PUBLIC_KEY", "test"); vi.stubEnv("VAPID_PRIVATE_KEY", "test");
  m.subs.mockResolvedValue([{ endpoint: "https://127.0.0.1/internal", ...keys }, { endpoint, ...keys }]);
  await sendPush("u", { title: "test", body: "test" });
  expect(m.send).toHaveBeenCalledTimes(1);
  expect(m.send.mock.calls[0][2].timeout).toBe(5000);
  expect(m.remove).toHaveBeenCalledWith({ where: { userId: "u", endpoint: "https://127.0.0.1/internal" } });
  expect(m.subs.mock.calls[0][0].take).toBe(5);
});
it("expires a stalled operation using a wall-clock deadline", async () => {
  vi.useFakeTimers();
  try { const check = expect(withPushDeadline(new Promise(() => {}), 20)).rejects.toThrow("deadline"); await vi.advanceTimersByTimeAsync(21); await check; }
  finally { vi.useRealTimers(); }
});
