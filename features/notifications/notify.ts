import "server-only";

import { db } from "@/lib/db";

type NotifyInput = {
  /** Destinataire de la notification. */
  userId: string | null | undefined;
  /** Auteur de l'action (pour éviter de se notifier soi-même). */
  actorId?: string | null;
  type: string;
  title: string;
  body: string;
  link?: string | null;
};

/**
 * Crée une notification, sauf si le destinataire est l'auteur de l'action
 * (pas d'auto-notification) ou si le destinataire est inconnu.
 */
export async function notify({
  userId,
  actorId,
  type,
  title,
  body,
  link,
}: NotifyInput): Promise<void> {
  if (!userId) return;
  if (actorId && actorId === userId) return;

  await db.notification.create({
    data: { userId, type, title, body, link: link ?? null },
  });
}
