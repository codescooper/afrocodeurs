"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MOBILE_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Barre de navigation basse mobile (icônes uniquement — cf. PRD UX/UI §3, §20). */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur md:hidden">
      {MOBILE_NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
