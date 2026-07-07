"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  Bookmark,
  User,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebarContext } from "./sidebar-context";

type NavEntry = { label: string; href: string; icon: LucideIcon };

const NAV_SECTIONS: { label: string; items: NavEntry[] }[] = [
  {
    label: "Général",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { label: "Mes contributions", href: "/dashboard/contributions", icon: FileText },
      { label: "Mes communautés", href: "/dashboard/communities", icon: Users },
      { label: "Mes favoris", href: "/dashboard/saved", icon: Bookmark },
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "Compte",
    items: [
      { label: "Profil", href: "/dashboard/profile", icon: User },
      { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

/** Sidebar du dashboard, repliable (desktop). Le lien Admin n'apparaît que pour les admins. */
export function DashboardSidebar({
  isAdmin = false,
  unreadCount = 0,
}: {
  isAdmin?: boolean;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const { isOpen } = useSidebarContext();

  const sections = isAdmin
    ? [
        ...NAV_SECTIONS,
        {
          label: "Modération",
          items: [{ label: "Administration", href: "/admin", icon: Shield }],
        },
      ]
    : NAV_SECTIONS;

  return (
    <aside
      className={cn(
        "hidden shrink-0 overflow-hidden border-r border-border transition-[width] duration-200 md:block",
        isOpen ? "w-60" : "w-0 border-r-0",
      )}
    >
      <nav className="flex w-60 flex-col gap-6 p-4">
        {sections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <h2 className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </h2>
            {section.items.map((item) => {
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
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
