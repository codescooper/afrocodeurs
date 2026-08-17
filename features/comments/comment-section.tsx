import type { EntityType } from "@prisma/client";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ContentActions } from "@/features/content-management/content-actions";
import { ReportForm } from "@/features/admin/report-form";
import { addEntityCommentAction } from "./actions";
export async function CommentSection({ targetType, targetId, returnPath }: { targetType: "KNOWLEDGE" | "PROBLEM" | "PROJECT" | "EVENT" | "OPPORTUNITY"; targetId: string; returnPath: string }) {
  const [session, comments] = await Promise.all([auth(), db.comment.findMany({ where: { targetType: targetType as EntityType, targetId }, orderBy: { createdAt: "asc" }, include: { author: { select: { username: true, name: true } } } })]);
  const allowed = can(session?.user?.role, "content:comment"), staff = can(session?.user?.role, "content:validate");
  return <section className="mt-10 border-t border-border pt-8"><h2 className="text-xl font-bold">Commentaires <span className="text-muted-foreground">{comments.length}</span></h2>{comments.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Aucun commentaire. Lancez la discussion.</p> : <ul className="mt-5 space-y-4">{comments.map(c => <li key={c.id} className="rounded-xl border border-border p-4"><p className="whitespace-pre-wrap text-sm">{c.body}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><Link href={`/u/${c.author.username}`} className="font-medium underline">{c.author.name ?? `@${c.author.username}`}</Link><span>{c.createdAt.toLocaleDateString("fr-FR")}</span>{(session?.user?.id === c.authorId || staff) && <ContentActions entityType="COMMENT" entityId={c.id} body={c.body} returnPath={returnPath} />}{session?.user && session.user.id !== c.authorId && <ReportForm targetType="COMMENT" targetId={c.id} />}</div></li>)}</ul>}{allowed ? <form action={addEntityCommentAction} className="mt-6 grid gap-3"><input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} /><input type="hidden" name="returnPath" value={returnPath} /><textarea name="body" required minLength={2} maxLength={3000} rows={4} className="rounded-md border border-border bg-background p-3 text-sm" placeholder="Ajouter un commentaire…" /><Button className="justify-self-start">Publier</Button></form> : <p className="mt-5 text-sm text-muted-foreground">Connectez-vous avec un compte vérifié pour commenter.</p>}</section>;
}
