import Link from "next/link";
import { Clock, Zap } from "lucide-react";
import type { KnowledgeType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { excerpt, readingTimeMinutes } from "@/lib/markdown";
import {
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_TYPES,
  KNOWLEDGE_TYPE_LABELS,
} from "@/features/knowledge/constants";
import { HubTemplate } from "@/components/templates/hub-template";
import { EntityCard } from "@/components/molecules/entity-card";
import { EmptyState } from "@/components/atoms/empty-state";
import { FilterPills } from "@/components/molecules/filter-pills";
import { knowledgeTypeIcon } from "@/components/atoms/knowledge-type-icon";
import { Avatar } from "@/components/shared/avatar";
import { SuggestionsRail } from "@/components/organisms/suggestions-rail";

export const metadata = { title: "Ressources" };

/** Bibliothèque communautaire de ressources publiées et filtrables. */
export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; level?: string; access?: string }>;
}) {
  const query = await searchParams;
  const type = KNOWLEDGE_TYPES.includes(query.type as KnowledgeType)
    ? (query.type as KnowledgeType)
    : undefined;
  const level = KNOWLEDGE_LEVELS.includes(
    query.level as (typeof KNOWLEDGE_LEVELS)[number],
  )
    ? query.level
    : undefined;
  const access = query.access === "free" || query.access === "paid"
    ? query.access
    : undefined;
  const session = await auth();
  const canCreate = can(session?.user?.role, "knowledge:create");

  const [items, typeCounts] = await Promise.all([
    db.knowledge.findMany({
      where: {
        status: "PUBLISHED",
        ...(type ? { type } : {}),
        ...(level ? { level } : {}),
        ...(access ? { isFree: access === "free" } : {}),
      },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { username: true, name: true, image: true } }, community: { select: { name: true, slug: true } } },
    }),
    db.knowledge.groupBy({
      by: ["type"],
      where: { status: "PUBLISHED" },
      _count: { type: true },
    }),
  ]);

  const boostGroups = items.length
    ? await db.vote.groupBy({
        by: ["targetId"],
        where: {
          targetType: "KNOWLEDGE",
          value: "UP",
          targetId: { in: items.map((item) => item.id) },
        },
        _count: { _all: true },
      })
    : [];
  const boosts = new Map(
    boostGroups.map((group) => [group.targetId, group._count._all]),
  );

  return (
    <HubTemplate
      title="Ressources"
      description="Cours, astuces, outils, vidéos et guides recommandés par la communauté."
      rail={<SuggestionsRail />}
      action={
        canCreate ? (
          <Link href="/knowledge/new" className={buttonVariants({ size: "sm" })}>
            Partager une ressource
          </Link>
        ) : undefined
      }
    >
      {typeCounts.length > 0 && (
        <div className="mb-6">
          <FilterPills
            baseHref="/knowledge"
            paramName="type"
            active={type}
            options={typeCounts.map((t) => ({
              label: KNOWLEDGE_TYPE_LABELS[t.type],
              value: t.type,
              count: t._count.type,
            }))}
          />
        </div>
      )}

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/20 p-4">
        {type && <input type="hidden" name="type" value={type} />}
        <label className="flex min-w-40 flex-col gap-1 text-xs font-medium">
          Niveau
          <select name="level" defaultValue={level ?? ""} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Tous les niveaux</option>
            {KNOWLEDGE_LEVELS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="flex min-w-36 flex-col gap-1 text-xs font-medium">
          Accès
          <select name="access" defaultValue={access ?? ""} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Gratuit et payant</option>
            <option value="free">Gratuit</option>
            <option value="paid">Payant</option>
          </select>
        </label>
        <button type="submit" className={buttonVariants({ size: "sm", variant: "outline" })}>Filtrer</button>
        {(level || access) && <Link href={type ? `/knowledge?type=${type}` : "/knowledge"} className="pb-2 text-xs underline">Réinitialiser</Link>}
      </form>

      {items.length === 0 ? (
        <EmptyState>
          {type
            ? "Aucune ressource de ce type pour l'instant."
            : "Aucune ressource publiée pour le moment."}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <EntityCard
              key={item.id}
              href={`/knowledge/${item.slug}`}
              icon={knowledgeTypeIcon(item.type)}
              eyebrow={KNOWLEDGE_TYPE_LABELS[item.type]}
              badge={`${item.isFree ? "Gratuit" : "Payant"} · ${item.lastVerifiedAt ? "Vérifié" : "Non vérifié"}${item.community ? ` · ${item.community.name}` : ""}`}
              title={item.title}
              description={item.summary ?? excerpt(item.content)}
              meta={
                <>
                  <Avatar
                    image={item.author.image}
                    name={item.author.name ?? item.author.username}
                    size={18}
                  />
                  {item.provider ?? item.author.name ?? `@${item.author.username}`}
                  <span aria-hidden>·</span>
                  <Clock className="size-3.5" />
                  {item.durationMinutes ?? readingTimeMinutes(item.content)} min
                  <span aria-hidden>·</span>
                  <Zap className="size-3.5" />
                  {boosts.get(item.id) ?? 0}
                </>
              }
            />
          ))}
        </div>
      )}
    </HubTemplate>
  );
}
