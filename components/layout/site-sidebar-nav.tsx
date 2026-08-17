"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MAIN_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Navigation verticale de la sidebar publique, avec état actif et icônes. */
export function SiteSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {MAIN_NAV.map((item) => {
        const active = pathname.startsWith(item.href);
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
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}