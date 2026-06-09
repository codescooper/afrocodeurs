import Link from "next/link";
import { Clock } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { excerpt, readingTimeMinutes } from "@/lib/markdown";
import { KNOWLEDGE_TYPE_LABELS } from "@/features/knowledge/constants";

export const metadata = { title: "Apprendre" };

/** Knowledge Hub — ressources publiées (Sprint 4). */
export default async function KnowledgePage() {
  const session = await auth();
  const canCreate = can(session?.user?.role, "knowledge:create");
  const items = await db.knowledge.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { username: true, name: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Hub</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Articles, tutoriels et guides rédigés par la communauté AfroMakers.
          </p>
        </div>
        {canCreate && (
          <Link href="/knowledge/new" className={buttonVariants({ size: "sm" })}>
            Rédiger une ressource
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucune ressource publiée pour le moment.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/knowledge/${item.slug}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                {KNOWLEDGE_TYPE_LABELS[item.type]}
              </span>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {item.summary ?? excerpt(item.content)}
              </p>
              <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {readingTimeMinutes(item.content)} min ·{" "}
                {item.author.name ?? `@${item.author.username}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
