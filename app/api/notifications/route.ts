import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Lue par la cloche (polling) — toujours dynamique, jamais mise en cache.
export const dynamic = "force-dynamic";

/** Compteur de non-lues + dernières notifications de l'utilisateur courant. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ unreadCount: 0, notifications: [] });
  }

  const userId = session.user.id;
  const [unreadCount, notifications] = await Promise.all([
    db.notification.count({ where: { userId, read: false } }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        body: true,
        link: true,
        read: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ unreadCount, notifications });
}
