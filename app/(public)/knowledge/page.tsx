import Link from "next/link";
import { Clock } from "lucide-react";
import type { KnowledgeType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { excerpt, readingTimeMinutes } from "@/lib/markdown";
import { KNOWLEDGE_TYPE_LABELS } from "@/features/knowledge/constants";
import { HubTemplate } from "@/components/templates/hub-template";
import { EntityCard } from "@/components/molecules/entity-card";
import { EmptyState } from "@/components/atoms/empty-state";
import { FilterPills } from "@/components/molecules/filter-pills";
import { knowledgeTypeIcon } from "@/components/atoms/knowledge-type-icon";
import { Avatar } from "@/components/shared/avatar";
import { SuggestionsRail } from "@/components/organisms/suggestions-rail";

export const metadata = { title: "Apprendre" };

/** Knowledge Hub — ressources publiées (Sprint 4), filtrables par type. */
export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const session = await auth();
  const canCreate = can(session?.user?.role, "knowledge:create");

  const [items, typeCounts] = await Promise.all([
    db.knowledge.findMany({
      where: {
        status: "PUBLISHED",
        ...(type ? { type: type as KnowledgeType } : {}),
      },
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { username: true, name: true, image: true } } },
    }),
    db.knowledge.groupBy({
      by: ["type"],
      where: { status: "PUBLISHED" },
      _count: { type: true },
    }),
  ]);

  return (
    <HubTemplate
      title="Knowledge Hub"
      description="Articles, tutoriels et guides rédigés par la communauté AfroMakers."
      rail={<SuggestionsRail />}
      action={
        canCreate ? (
          <Link href="/knowledge/new" className={buttonVariants({ size: "sm" })}>
            Rédiger une ressource
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
              badge={item.level ?? undefined}
              title={item.title}
              description={item.summary ?? excerpt(item.content)}
              meta={
                <>
                  <Avatar
                    image={item.author.image}
                    name={item.author.name ?? item.author.username}
                    size={18}
                  />
                  {item.author.name ?? `@${item.author.username}`}
                  <span aria-hidden>·</span>
                  <Clock className="size-3.5" />
                  {readingTimeMinutes(item.content)} min
                </>
              }
            />
          ))}
        </div>
      )}
    </HubTemplate>
  );
}
