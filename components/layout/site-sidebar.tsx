import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";
import { SiteSidebarNav } from "./site-sidebar-nav";
import { ThemeToggle } from "./theme-toggle";

/** Sidebar verticale publique (desktop) : logo, navigation, actions centrées en bas. */
export async function SiteSidebar() {
  const session = await auth();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-background md:flex">
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            A
          </span>
          <span>AfroCodeurs</span>
        </Link>
      </div>

      <SiteSidebarNav />

      <div className="mt-auto border-t border-border p-4">
        <div className="mb-3 flex items-center justify-center gap-1">
          <ThemeToggle />
          {session?.user && <NotificationBell align="start" />}
        </div>

        {session?.user ? (
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-center",
              )}
            >
              @{session.user.username}
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full justify-center"
              >
                Déconnexion
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-center",
              )}
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "sm", shape: "pill" }),
                "w-full justify-center",
              )}
            >
              Rejoindre
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
