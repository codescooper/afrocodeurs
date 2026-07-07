import Link from "next/link";
import { Users } from "lucide-react";
import type { CommunityType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import {
  COMMUNITY_TYPE_LABELS,
} from "@/features/communities/constants";
import { getLeaderboard } from "@/features/reputation/queries";
import { HubTemplate } from "@/components/templates/hub-template";
import { EmptyState } from "@/components/atoms/empty-state";
import { FilterPills } from "@/components/molecules/filter-pills";
import { AvatarCard } from "@/components/molecules/avatar-card";
import { DiscoveryCard } from "@/components/molecules/discovery-card";

export const metadata = { title: "Communautés" };

/** Liste publique des communautés (Sprint 2), façon annuaire de serveurs Discord. */
export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const session = await auth();

  const [communities, typeCounts, makers] = await Promise.all([
    db.community.findMany({
      where: type ? { type: type as CommunityType } : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    }),
    db.community.groupBy({ by: ["type"], _count: { type: true } }),
    getLeaderboard(5),
  ]);

  return (
    <HubTemplate
      title="Communautés"
      description="Rejoignez des communautés par métier, pays, université ou secteur."
      rail={
        <DiscoveryCard
          title="AfroMakers à suivre"
          subtitle="Build Before Consume"
          href="/afromakers"
          empty="Le classement se remplit avec les contributions."
          items={makers.map((m) => ({
            label: m.user.name ?? `@${m.user.username}`,
            href: `/u/${m.user.username}`,
            meta: `${m.points} pts`,
          }))}
        />
      }
      action={
        session?.user ? (
          <Link
            href="/communities/new"
            className={buttonVariants({ size: "sm" })}
          >
            Créer une communauté
          </Link>
        ) : undefined
      }
    >
      {typeCounts.length > 0 && (
        <div className="mb-6">
          <FilterPills
            baseHref="/communities"
            paramName="type"
            active={type}
            options={typeCounts.map((t) => ({
              label: COMMUNITY_TYPE_LABELS[t.type],
              value: t.type,
              count: t._count.type,
            }))}
          />
        </div>
      )}

      {communities.length === 0 ? (
        <EmptyState>
          {type
            ? "Aucune communauté de ce type pour l'instant."
            : "Aucune communauté pour le moment. Soyez le premier à en créer une !"}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {communities.map((community) => (
            <AvatarCard
              key={community.id}
              href={`/communities/${community.slug}`}
              avatarName={community.name}
              eyebrow={COMMUNITY_TYPE_LABELS[community.type]}
              title={community.name}
              description={community.description ?? undefined}
              meta={
                <>
                  <Users className="size-3.5" />
                  {community._count.members} membre
                  {community._count.members > 1 ? "s" : ""}
                </>
              }
            />
          ))}
        </div>
      )}
    </HubTemplate>
  );
}
