"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  User,
  Settings,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";

const DASHBOARD_NAV = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mes contributions", href: "/dashboard/contributions", icon: FileText },
  { label: "Mes communautés", href: "/dashboard/communities", icon: Users },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Profil", href: "/dashboard/profile", icon: User },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

/** Sidebar du dashboard. Le lien Admin n'apparaît que pour les admins. */
export function DashboardSidebar({
  isAdmin = false,
  unreadCount = 0,
}: {
  isAdmin?: boolean;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...DASHBOARD_NAV, { label: "Administration", href: "/admin", icon: Shield }]
    : DASHBOARD_NAV;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border md:block">
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
