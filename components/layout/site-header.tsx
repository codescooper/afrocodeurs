import Link from "next/link";

import { auth, signOut } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { MainNav } from "./main-nav";
import { NotificationBell } from "./notification-bell";

/** En-tête public : logo + navigation desktop + état d'authentification. */
export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            A
          </span>
          <span className="hidden sm:inline">AfroCodeurs</span>
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-2">
          {session?.user ? (
            <>
              <NotificationBell />
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                @{session.user.username}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Déconnexion
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Connexion
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>
                Rejoindre
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
