"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { NOTIFICATION_CATEGORIES } from "./constants";

/** Marque toutes les notifications non lues de l'utilisateur comme lues. */
export async function markNotificationsReadAction(): Promise<void> {
  const g = await guard();
  if (!g.ok) return;

  await db.notification.updateMany({
    where: { userId: g.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

/** Met à jour les préférences : on stocke les catégories DÉSACTIVÉES (opt-out). */
export async function updateNotificationPrefsAction(
  formData: FormData,
): Promise<void> {
  const g = await guard();
  if (!g.ok) return;

  const enabled = new Set(formData.getAll("category").map(String));
  const optOut = NOTIFICATION_CATEGORIES.map((c) => c.key).filter(
    (key) => !enabled.has(key),
  );

  await db.user.update({
    where: { id: g.user.id },
    data: { notificationOptOut: optOut },
  });
  revalidatePath("/dashboard/notifications");
}
