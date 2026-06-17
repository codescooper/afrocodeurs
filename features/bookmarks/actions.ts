"use server";

import { revalidatePath } from "next/cache";
import type { EntityType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Enregistre / retire un contenu des favoris. Renvoie le nouvel état. */
export async function toggleBookmarkAction(
  targetType: EntityType,
  targetId: string,
): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id || !targetId) return false;

  const where = {
    userId_targetType_targetId: {
      userId: session.user.id,
      targetType,
      targetId,
    },
  };
  const existing = await db.bookmark.findUnique({ where });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/saved");
    return false;
  }

  await db.bookmark.create({
    data: { userId: session.user.id, targetType, targetId },
  });
  revalidatePath("/dashboard/saved");
  return true;
}
