import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { updateUserRoleAction } from "@/features/admin/actions";
import { USER_ROLE_LABELS, USER_ROLES } from "@/features/admin/constants";

export const metadata = { title: "Gestion des utilisateurs" };

/** Gestion des rôles utilisateurs (Sprint 8). Réservé aux ADMIN. */
export default async function AdminUsersPage() {
  const session = await auth();
  if (!can(session?.user?.role, "user:manage")) redirect("/admin");
  const meId = session!.user.id;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Administration
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Utilisateurs</h1>
      </div>

      <ul className="flex flex-col gap-2">
        {users.map((user) => {
          const isMe = user.id === meId;
          return (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
            >
              <span className="flex flex-col">
                <span className="font-medium">
                  {user.name ?? `@${user.username}`}
                  {isMe && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (vous)
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>

              {isMe ? (
                <span className="text-sm text-muted-foreground">
                  {USER_ROLE_LABELS[user.role]}
                </span>
              ) : (
                <form action={updateUserRoleAction} className="flex gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {USER_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    Enregistrer
                  </Button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
