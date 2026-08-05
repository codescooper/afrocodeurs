import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { SidebarToggle } from "./sidebar-toggle";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/** En-tête sticky de l'espace connecté : titre, raccourci vers le site, notifications, menu utilisateur. */
export async function DashboardHeader() {
  const session = await auth();
  if (!session?.user) return null;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <SidebarToggle />

      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold leading-none">
          Tableau de bord
        </h1>
        <p className="text-xs text-muted-foreground">AfroCodeurs</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "hidden sm:inline-flex",
          )}
        >
          Voir le site
        </Link>
        <ThemeToggle />
        <NotificationBell />
        <UserMenu user={session.user} signOutAction={signOutAction} />
      </div>
    </header>
  );
}
