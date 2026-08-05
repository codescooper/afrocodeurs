import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { hasRank } from "@/lib/permissions";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

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
    <SidebarProvider>
      <div className="flex min-h-dvh flex-col">
        <DashboardHeader />
        <div className="flex w-full flex-1">
          <DashboardSidebar isAdmin={isStaff} unreadCount={unreadCount} />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
