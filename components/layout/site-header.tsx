import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { Logo } from "@/components/atoms/logo";
import { buttonVariants } from "@/components/ui/button";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/** En-tête mobile compact : logo + actions. La navigation principale est dans la sidebar (desktop). */
export async function SiteHeader() {
  const session = await auth();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
      <Logo />

      <div className="ml-auto flex items-center gap-1">
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
    </header>
  );
}