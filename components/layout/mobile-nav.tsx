"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { MAIN_NAV, MOBILE_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const VISIBLE_HREFS = new Set(MOBILE_NAV.map((item) => item.href));
const MORE_NAV = MAIN_NAV.filter((item) => !VISIBLE_HREFS.has(item.href));

/** Barre de navigation basse mobile (icônes uniquement — cf. PRD UX/UI §3, §20). */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur md:hidden">
      {MOBILE_NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
            MORE_NAV.some((item) => pathname.startsWith(item.href)) && "text-primary",
          )}
          aria-label="Ouvrir toute la navigation"
        >
          <MoreHorizontal className="size-5" />
          <span>Menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="mb-2 w-[min(22rem,calc(100vw-1rem))]">
          <DropdownMenuLabel>Toutes les rubriques</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {MORE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href} className="flex items-center gap-2 py-2.5">
                  <Icon />
                  {item.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="py-2.5">Mon espace</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
