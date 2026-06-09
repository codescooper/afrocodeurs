import Link from "next/link";
import { Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { COMMUNITY_TYPE_LABELS } from "@/features/communities/constants";

export const metadata = { title: "Mes communautés" };

/** Communautés rejointes par l'utilisateur courant (Sprint 2). */
export default async function MyCommunitiesPage() {
  const session = await auth();
  const memberships = await db.communityMember.findMany({
    where: { userId: session!.user.id },
    orderBy: { joinedAt: "desc" },
    include: {
      community: { include: { _count: { select: { members: true } } } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes communautés</h1>
          <p className="text-sm text-muted-foreground">
            Les communautés que vous avez rejointes.
          </p>
        </div>
        <Link
          href="/communities"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Explorer
        </Link>
      </header>

      {memberships.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Vous n&apos;avez rejoint aucune communauté pour l&apos;instant.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {memberships.map((membership) => (
            <li key={membership.id}>
              <Link
                href={`/communities/${membership.community.slug}`}
                className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors hover:bg-muted/40"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-primary">
                  {COMMUNITY_TYPE_LABELS[membership.community.type]}
                </span>
                <h2 className="font-semibold">{membership.community.name}</h2>
                <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {membership.community._count.members} membre
                  {membership.community._count.members > 1 ? "s" : ""} ·{" "}
                  {membership.role}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
