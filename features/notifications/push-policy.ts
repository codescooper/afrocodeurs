import "server-only";
import { ECDH } from "node:crypto";
import { lookup } from "node:dns/promises";
import { Agent } from "node:https";
import { BlockList, isIP } from "node:net";
import type { LookupAddress } from "node:dns";
import { z } from "zod";

export const MAX_PUSH_SUBSCRIPTIONS = 5;
export const PUSH_TIMEOUT_MS = 5000;
const providers = new Set(["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"]);

export function allowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return value.length <= 2048 && value === url.href && url.protocol === "https:" && !url.username && !url.password &&
      !url.hash && (!url.port || url.port === "443") &&
      (providers.has(url.hostname) || /^[a-z0-9-]+\.(?:notify\.windows|push\.apple)\.com$/.test(url.hostname));
  } catch { return false; }
}

function validKey(value: string, bytes: number): boolean {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) return false;
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== bytes || decoded.toString("base64url") !== value.replace(/=+$/, "")) return false;
  if (bytes === 65) {
    try { return decoded[0] === 4 && ECDH.convertKey(decoded, "prime256v1").length === 65; }
    catch { return false; }
  }
  return true;
}
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().max(2048).refine(allowedPushEndpoint),
  keys: z.object({
    p256dh: z.string().max(100).refine(value => validKey(value, 65)),
    auth: z.string().max(30).refine(value => validKey(value, 16)),
  }),
});

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) blocked.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]] as const) blocked.addSubnet(network, prefix, "ipv6");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
export function publicPushAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address, "ipv4") : family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}

export async function withPushDeadline<T>(operation: Promise<T>, timeoutMs = PUSH_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Push deadline exceeded")), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

export async function resolvePushAddress(endpoint: string): Promise<LookupAddress> {
  if (!allowedPushEndpoint(endpoint)) throw new Error("Push endpoint not allowed");
  const addresses = await withPushDeadline(lookup(new URL(endpoint).hostname, { all: true, verbatim: true }), 2000);
  if (!addresses.length || addresses.some(item => !publicPushAddress(item.address))) throw new Error("Push DNS destination not allowed");
  return addresses.find(item => item.family === 4) ?? addresses[0];
}

export function pinnedPushAgent(endpoint: string, address: LookupAddress): Agent {
  const expected = new URL(endpoint).hostname;
  // Keep hostname/SNI and TLS verification, but never perform a second DNS lookup.
  return new Agent({ lookup(hostname, options, callback) {
    if (hostname !== expected) return callback(new Error("Unexpected push hostname"), "");
    if (options.all) callback(null, [address]);
    else callback(null, address.address, address.family);
  } });
}

export async function readPushJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return null; }
  finally { reader.releaseLock(); }
}
