"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/features/notifications/notify";

/** Suit / ne suit plus un utilisateur. Renvoie le nouvel état (true = suivi). */
export async function toggleFollowAction(targetId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id || !targetId || targetId === session.user.id) {
    return false;
  }

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetId,
      },
    },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return false;
  }

  await db.follow.create({
    data: { followerId: session.user.id, followingId: targetId },
  });
  await notify({
    userId: targetId,
    actorId: session.user.id,
    type: "FOLLOW",
    title: "Nouvel abonné",
    body: `@${session.user.username} te suit désormais.`,
    link: `/u/${session.user.username}`,
  });
  return true;
}
