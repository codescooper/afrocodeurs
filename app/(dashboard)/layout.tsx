import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { hasRank } from "@/lib/permissions";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

/** Layout dashboard : réservé aux utilisateurs connectés (cf. SDD §7). */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isStaff = hasRank(session.user.role, "MODERATOR");
  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1">
        <DashboardSidebar isAdmin={isStaff} unreadCount={unreadCount} />
        <main className="flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
