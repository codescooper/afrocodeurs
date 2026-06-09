import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { hasRank } from "@/lib/permissions";

/** Layout admin : réservé aux MODERATOR et ADMIN (cf. SDD §7, §16). */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRank(session.user.role, "MODERATOR")) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/admin" className="font-bold">
            AfroCodeurs · Administration
          </Link>
          <Link href="/dashboard" className="text-sm underline">
            Retour au tableau de bord
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
