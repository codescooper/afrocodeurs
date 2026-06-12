import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, hasRank } from "@/lib/permissions";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import { readingTimeMinutes } from "@/lib/markdown";
import { moderateKnowledgeAction } from "@/features/knowledge/actions";
import {
  CONTENT_STATUS_LABELS,
  KNOWLEDGE_TYPE_LABELS,
} from "@/features/knowledge/constants";

/** Page détail d'une ressource (Sprint 4) : rendu Markdown + modération. */
export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const item = await db.knowledge.findUnique({
    where: { slug },
    include: { author: { select: { id: true, username: true, name: true } } },
  });

  if (!item) notFound();

  const isStaff = session?.user
    ? hasRank(session.user.role, "MODERATOR")
    : false;
  const isAuthor = session?.user?.id === item.author.id;

  // Une ressource non publiée n'est visible que par son auteur ou le staff.
  if (item.status !== "PUBLISHED" && !isAuthor && !isStaff) notFound();

  const canModerate =
    item.status === "SUBMITTED" && can(session?.user?.role, "content:validate");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link
        href="/knowledge"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Toutes les ressources
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-primary">
          {KNOWLEDGE_TYPE_LABELS[item.type]}
        </span>
        {item.status !== "PUBLISHED" && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {CONTENT_STATUS_LABELS[item.status]}
          </span>
        )}
      </div>

      <h1 className="mt-1 text-3xl font-bold tracking-tight">{item.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          Par{" "}
          <Link
            href={`/u/${item.author.username}`}
            className="font-medium text-foreground hover:underline"
          >
            {item.author.name ?? `@${item.author.username}`}
          </Link>
          {item.level ? ` · ${item.level}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" />
          {readingTimeMinutes(item.content)} min de lecture
        </span>
      </div>

      {item.summary && (
        <p className="mt-6 text-lg text-muted-foreground">{item.summary}</p>
      )}

      <article className="mt-6">
        <Markdown>{item.content}</Markdown>
      </article>

      {canModerate && (
        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <span className="text-sm font-medium">Modération :</span>
          <form action={moderateKnowledgeAction}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="slug" value={item.slug} />
            <input type="hidden" name="decision" value="publish" />
            <Button type="submit" size="sm">
              Publier
            </Button>
          </form>
          <form action={moderateKnowledgeAction}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="slug" value={item.slug} />
            <input type="hidden" name="decision" value="reject" />
            <Button type="submit" size="sm" variant="destructive">
              Rejeter
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
