import type { EntityType } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { ContentActions } from "@/features/content-management/content-actions";
import { ReportForm } from "@/features/admin/report-form";
import { EntityCommentForm } from "./comment-form";
export async function CommentSection({ targetType, targetId, returnPath }: { targetType: "KNOWLEDGE" | "PROBLEM" | "PROJECT" | "EVENT" | "OPPORTUNITY" | "COMMUNITY_VENTURE"; targetId: string; returnPath: string }) {
  const [session, comments] = await Promise.all([auth(), db.comment.findMany({ where: { targetType: targetType as EntityType, targetId }, orderBy: { createdAt: "asc" }, include: { author: { select: { username: true, name: true } } } })]);
  const allowed = can(session?.user?.role, "content:comment"), staff = can(session?.user?.role, "content:validate");
  return <section className="mt-10 border-t border-border pt-8"><h2 className="text-xl font-bold">Commentaires <span className="text-muted-foreground">{comments.length}</span></h2>{comments.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Aucun commentaire. Lancez la discussion.</p> : <ul className="mt-5 space-y-4">{comments.map(c => <li key={c.id} className="rounded-xl border border-border p-4"><p className="whitespace-pre-wrap text-sm">{c.body}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><Link href={`/u/${c.author.username}`} className="font-medium underline">{c.author.name ?? `@${c.author.username}`}</Link><span>{c.createdAt.toLocaleDateString("fr-FR")}</span>{(session?.user?.id === c.authorId || staff) && <ContentActions entityType="COMMENT" entityId={c.id} body={c.body} returnPath={returnPath} />}{session?.user && session.user.id !== c.authorId && <ReportForm targetType="COMMENT" targetId={c.id} />}</div></li>)}</ul>}{allowed ? <EntityCommentForm targetType={targetType} targetId={targetId} returnPath={returnPath} /> : <p className="mt-5 text-sm text-muted-foreground">Connectez-vous avec un compte vérifié pour commenter.</p>}</section>;
}
