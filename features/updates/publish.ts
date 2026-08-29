import "server-only";

import { db } from "@/lib/db";
import { notify } from "@/features/notifications/notify";

type PublishedUpdate = {
  title: string;
  summary: string;
};

/** Notifie les membres vérifiés d'une nouveauté, par lots raisonnables. */
export async function notifyPublishedUpdate(
  update: PublishedUpdate,
  actorId: string,
  excludedUserIds: Iterable<string> = [],
): Promise<void> {
  const excluded = new Set(excludedUserIds);
  const users = await db.user.findMany({
    where: { emailVerified: { not: null } },
    select: { id: true },
    take: 2000,
  });
  const recipients = users.filter((user) => !excluded.has(user.id));
  for (let index = 0; index < recipients.length; index += 50) {
    await Promise.all(
      recipients.slice(index, index + 50).map((user) =>
        notify({
          userId: user.id,
          actorId,
          type: "PLATFORM_UPDATE",
          title: update.title,
          body: update.summary,
          link: "/updates",
        }),
      ),
    );
  }
}
