import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar } from "@/components/shared/avatar";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/atoms/empty-state";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const memberships = await db.conversationMember.findMany({ where: { userId: session.user.id }, orderBy: { conversation: { updatedAt: "desc" } }, include: { conversation: { include: { members: { include: { user: { select: { id: true, username: true, name: true, image: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1, include: { author: { select: { username: true } } } } } } } });

  return <div className="mx-auto w-full max-w-4xl px-4 py-12"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Messagerie</h1><p className="mt-1 text-muted-foreground">Échangez en privé ou créez un groupe de travail.</p></div><Link href="/messages/new" className={buttonVariants({ size: "sm" })}><Plus /> Nouvelle conversation</Link></header>
  <div className="mt-8">{memberships.length === 0 ? <EmptyState><MessageCircle className="mx-auto mb-3 size-8" />Aucune conversation pour le moment.</EmptyState> : <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">{memberships.map((membership) => { const conversation = membership.conversation; const others = conversation.members.filter((member) => member.userId !== session.user.id); const last = conversation.messages[0]; const unread = Boolean(last && last.authorId !== session.user.id && last.createdAt > membership.lastReadAt); const title = conversation.type === "GROUP" ? conversation.title : others.map((member) => member.user.name ?? `@${member.user.username}`).join(", "); const avatar = conversation.type === "DIRECT" ? others[0]?.user : null; return <li key={conversation.id}><Link href={`/messages/${conversation.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"><Avatar image={avatar?.image} name={title ?? "Groupe"} size={44} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="truncate">{title ?? "Conversation"}</strong>{last && <time className="shrink-0 text-xs text-muted-foreground">{last.createdAt.toLocaleDateString("fr-FR")}</time>}</span><span className="mt-1 block truncate text-sm text-muted-foreground">{last ? `${last.author.username} : ${last.body}` : "Nouvelle conversation"}</span></span>{unread && <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-label="Nouveau message" />}</Link></li>; })}</ul>}</div></div>;
}
