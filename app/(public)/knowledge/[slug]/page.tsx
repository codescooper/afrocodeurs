import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ExternalLink, Eye, ShieldCheck, ShieldQuestion, Zap } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, hasRank } from "@/lib/permissions";
import { Markdown } from "@/components/shared/markdown";
import { Button, buttonVariants } from "@/components/ui/button";
import { readingTimeMinutes } from "@/lib/markdown";
import {
  boostKnowledgeAction,
  moderateKnowledgeAction,
} from "@/features/knowledge/actions";
import {
  CONTENT_STATUS_LABELS,
  KNOWLEDGE_TYPE_LABELS,
} from "@/features/knowledge/constants";
import { ReportForm } from "@/features/admin/report-form";
import { CommentSection } from "@/features/comments/comment-section";
import { SaveButton } from "@/features/bookmarks/save-button";
import { isBookmarked } from "@/features/bookmarks/queries";
import { ContentActions } from "@/features/content-management/content-actions";
import { promoteContentToFeedbackAction } from "@/features/product-feedback/actions";

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
    include: { author: { select: { id: true, username: true, name: true } }, community: { select: { name: true, slug: true } } },
  });

  if (!item) notFound();

  const isStaff = session?.user
    ? hasRank(session.user.role, "MODERATOR")
    : false;
  const isAuthor = session?.user?.id === item.author.id;

  // Une ressource non publiée n'est visible que par son auteur ou le staff.
  if (item.status !== "PUBLISHED" && !isAuthor && !isStaff) notFound();

  if (item.status === "PUBLISHED") {
    await db.knowledge.update({
      where: { id: item.id },
      data: { views: { increment: 1 } },
    });
  }

  const canModerate =
    item.status === "SUBMITTED" && can(session?.user?.role, "content:validate");

  const [savedKnowledge, boostCount, myBoost] = await Promise.all([
    isBookmarked(session?.user?.id, "KNOWLEDGE", item.id),
    db.vote.count({
      where: { targetType: "KNOWLEDGE", targetId: item.id, value: "UP" },
    }),
    session?.user?.id
      ? db.vote.findUnique({
          where: {
            userId_targetType_targetId: {
              userId: session.user.id,
              targetType: "KNOWLEDGE",
              targetId: item.id,
            },
          },
        })
      : null,
  ]);

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
        {item.community && <Link href={`/communities/${item.community.slug}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium hover:bg-primary/20">Publié depuis {item.community.name}</Link>}
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
          {item.provider ? ` · ${item.provider}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" />
          {item.durationMinutes ?? readingTimeMinutes(item.content)} min
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="size-4" />
          {item.views} vue{item.views > 1 ? "s" : ""}
        </span>
        {session?.user && (
          <SaveButton
            targetType="KNOWLEDGE"
            targetId={item.id}
            initialSaved={savedKnowledge}
          />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {item.isFree ? "Accès gratuit" : "Ressource payante"}
        </span>
        {item.status === "PUBLISHED" && (
          <span
            className={item.lastVerifiedAt
              ? "inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent"
              : "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-foreground"}
          >
            {item.lastVerifiedAt ? <ShieldCheck className="size-4" /> : <ShieldQuestion className="size-4" />}
            {item.lastVerifiedAt ? "Vérifié par AfroCodeurs" : "Non vérifié"}
          </span>
        )}
        {item.status === "PUBLISHED" && session?.user && (
          <form action={boostKnowledgeAction}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="slug" value={item.slug} />
            <Button type="submit" size="sm" variant={myBoost ? "primary" : "outline"}>
              <Zap /> {myBoost ? "Boostée" : "Booster"} · {boostCount}
            </Button>
          </form>
        )}
        {item.externalUrl && (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "sm" })}
          >
            Accéder à la ressource <ExternalLink />
          </a>
        )}
      </div>

      {item.summary && (
        <p className="mt-6 text-lg text-muted-foreground">{item.summary}</p>
      )}

      <article className="mt-6">
        <Markdown>{item.content}</Markdown>
      </article>
      {(isAuthor || isStaff) && <div className="mt-4"><ContentActions entityType="KNOWLEDGE" entityId={item.id} title={item.title} body={item.content} returnPath={`/knowledge/${item.slug}`} /></div>}
      {isStaff && <form action={promoteContentToFeedbackAction} className="mt-2"><input type="hidden" name="sourceType" value="KNOWLEDGE"/><input type="hidden" name="sourceId" value={item.id}/><input type="hidden" name="sourceUrl" value={`/knowledge/${item.slug}`}/><input type="hidden" name="title" value={item.title}/><input type="hidden" name="description" value={item.summary ?? item.content.slice(0, 2000)}/><button className="text-xs font-medium text-accent underline">Transformer en demande produit</button></form>}

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

      <CommentSection targetType="KNOWLEDGE" targetId={item.id} returnPath={`/knowledge/${item.slug}`} />
      {session?.user && (
        <div className="mt-10 border-t border-border pt-4">
          <ReportForm targetType="KNOWLEDGE" targetId={item.id} />
        </div>
      )}
    </div>
  );
}
