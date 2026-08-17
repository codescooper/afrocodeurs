import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { MainNav } from "./main-nav";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/** En-tête public : logo + navigation desktop + état d'authentification. */
export async function SiteHeader() {
  const session = await auth();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 lg:gap-5">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            A
          </span>
          <span className="hidden sm:inline">AfroCodeurs</span>
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {session?.user ? (
            <>
              <NotificationBell />
              <UserMenu user={session.user} signOutAction={signOutAction} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ size: "sm", shape: "pill" })}
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
