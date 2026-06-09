import Link from "next/link";
import { Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { COMMUNITY_TYPE_LABELS } from "@/features/communities/constants";

export const metadata = { title: "Communautés" };

/** Liste publique des communautés (Sprint 2). */
export default async function CommunitiesPage() {
  const session = await auth();
  const communities = await db.community.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communautés</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Rejoignez des communautés par métier, pays, université ou secteur.
          </p>
        </div>
        {session?.user && (
          <Link
            href="/communities/new"
            className={buttonVariants({ size: "sm" })}
          >
            Créer une communauté
          </Link>
        )}
      </div>

      {communities.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucune communauté pour le moment. Soyez le premier à en créer une !
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.slug}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                {COMMUNITY_TYPE_LABELS[community.type]}
              </span>
              <h2 className="font-semibold">{community.name}</h2>
              {community.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {community.description}
                </p>
              )}
              <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                {community._count.members} membre
                {community._count.members > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
