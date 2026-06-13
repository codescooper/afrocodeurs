import "server-only";

import { db } from "@/lib/db";
import { categoryForType } from "./constants";
import { sendPush } from "./push";

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
 * Crée une notification (et un push web), sauf si :
 * - le destinataire est l'auteur de l'action (pas d'auto-notification),
 * - le destinataire a désactivé la catégorie correspondante.
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

  // Respecter les préférences (catégories désactivées par l'utilisateur).
  const category = categoryForType(type);
  if (category) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { notificationOptOut: true },
    });
    if (user?.notificationOptOut.includes(category)) return;
  }

  await db.notification.create({
    data: { userId, type, title, body, link: link ?? null },
  });

  // Push web (best-effort — ne doit jamais casser la notification en base).
  try {
    await sendPush(userId, { title, body, url: link ?? null });
  } catch {
    /* ignore */
  }
}
