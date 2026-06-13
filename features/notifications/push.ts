import "server-only";

import webpush from "web-push";

import { db } from "@/lib/db";

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
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
        }
      }
    }),
  );
}
