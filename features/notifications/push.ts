import "server-only";

import webpush from "web-push";

import { db } from "@/lib/db";
import { MAX_PUSH_SUBSCRIPTIONS, PUSH_TIMEOUT_MS, pinnedPushAgent, pushSubscriptionSchema, resolvePushAddress, withPushDeadline } from "./push-policy";

let configured = false;

/** Configure web-push avec les clés VAPID. Retourne false si elles manquent. */
function configure(): boolean {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    VAPID_SUBJECT || "mailto:contact@afrocodeurs.org",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string | null };

/**
 * Envoie une notification push à tous les abonnements de l'utilisateur
 * (best-effort). Les abonnements expirés (404/410) sont nettoyés.
 */
export async function sendPush(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!configure()) return; // pas de clés VAPID → push désactivé
  const subs = await db.pushSubscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: MAX_PUSH_SUBSCRIPTIONS });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  for (let offset = 0; offset < subs.length; offset += 3) {
    await Promise.all(subs.slice(offset, offset + 3).map(async (s) => {
      const parsed = pushSubscriptionSchema.safeParse({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } });
      if (!parsed.success) {
        await db.pushSubscription.deleteMany({ where: { userId, endpoint: s.endpoint } });
        return;
      }
      let agent: ReturnType<typeof pinnedPushAgent> | undefined;
      try {
        const address = await resolvePushAddress(s.endpoint);
        agent = pinnedPushAgent(s.endpoint, address);
        await withPushDeadline(webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
          { timeout: PUSH_TIMEOUT_MS, agent },
        ));
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.pushSubscription.deleteMany({ where: { userId, endpoint: s.endpoint } });
        }
      } finally { agent?.destroy(); }
    }));
  }
}
