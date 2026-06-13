import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { markNotificationsReadAction } from "@/features/notifications/actions";

export const metadata = { title: "Notifications" };

/** Notifications de l'utilisateur (décisions de modération, suites de signalements…). */
export default async function NotificationsPage() {
  const session = await auth();
  const notifications = await db.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Décisions et suites de tes signalements et contributions.
          </p>
        </div>
        {hasUnread && (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              Tout marquer comme lu
            </Button>
          </form>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucune notification pour le moment.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => {
            const body = (
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2 font-medium">
                  {!n.read && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  )}
                  {n.title}
                </span>
                <span className="text-sm text-muted-foreground">{n.body}</span>
                <span className="text-[11px] text-muted-foreground">
                  {n.createdAt.toLocaleString("fr-FR")}
                </span>
              </span>
            );
            const className = cn(
              "block rounded-lg border px-4 py-3 transition-colors",
              n.read
                ? "border-border"
                : "border-primary/40 bg-primary/5 hover:bg-primary/10",
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div className={className}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
