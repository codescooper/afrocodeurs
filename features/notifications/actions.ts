"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NOTIFICATION_CATEGORIES } from "./constants";

/** Marque toutes les notifications non lues de l'utilisateur comme lues. */
export async function markNotificationsReadAction(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

/** Met à jour les préférences : on stocke les catégories DÉSACTIVÉES (opt-out). */
export async function updateNotificationPrefsAction(
  formData: FormData,
): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const enabled = new Set(formData.getAll("category").map(String));
  const optOut = NOTIFICATION_CATEGORIES.map((c) => c.key).filter(
    (key) => !enabled.has(key),
  );

  await db.user.update({
    where: { id: session.user.id },
    data: { notificationOptOut: optOut },
  });
  revalidatePath("/dashboard/notifications");
}
