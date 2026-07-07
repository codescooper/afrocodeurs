import { db } from "@/lib/db";
import { getLeaderboard } from "@/features/reputation/queries";
import { DiscoveryCard } from "@/components/molecules/discovery-card";

/** Rail contextuel des pages hub : communautés actives + AfroMakers à suivre. */
export async function SuggestionsRail() {
  const [communities, makers] = await Promise.all([
    db.community.findMany({
      select: { name: true, slug: true, _count: { select: { members: true } } },
      orderBy: { members: { _count: "desc" } },
      take: 5,
    }),
    getLeaderboard(5),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <DiscoveryCard
        title="Communautés actives"
        subtitle="Qui peut m'aider ?"
        href="/communities"
        empty="Aucune communauté pour l'instant."
        items={communities.map((c) => ({
          label: c.name,
          href: `/communities/${c.slug}`,
          meta: `${c._count.members} membre${c._count.members > 1 ? "s" : ""}`,
        }))}
      />
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
    </div>
  );
}
