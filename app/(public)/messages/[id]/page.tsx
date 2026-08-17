import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LogOut, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/features/messaging/chat-room";
import { leaveConversationAction } from "@/features/messaging/actions";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const membership = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: id, userId: session.user.id } }, include: { conversation: { include: { members: { include: { user: { select: { id: true, username: true, name: true } } } } } } } });
  if (!membership) notFound();
  const rawMessages = await db.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "desc" }, take: 101, select: { id: true, body: true, createdAt: true, authorId: true, author: { select: { username: true, name: true, image: true } } } });
  await db.conversationMember.update({ where: { id: membership.id }, data: { lastReadAt: new Date() } });
  const others = membership.conversation.members.filter((member) => member.userId !== session.user.id);
  const title = membership.conversation.type === "GROUP" ? membership.conversation.title : others.map((member) => member.user.name ?? `@${member.user.username}`).join(", ");
  const initialMessages = rawMessages.slice(0, 100).reverse().map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }));

  return <div className="mx-auto w-full max-w-5xl px-4 py-6"><div className="overflow-hidden rounded-xl border border-border bg-background"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><div className="flex items-center gap-3"><Link href="/messages" className="text-sm text-muted-foreground hover:underline">← Messages</Link><span className="h-5 w-px bg-border" /><div><h1 className="font-semibold">{title ?? "Conversation"}</h1><p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" />{membership.conversation.members.length} membre(s)</p></div></div>{membership.conversation.type === "GROUP" && <form action={leaveConversationAction}><input type="hidden" name="id" value={id} /><Button type="submit" size="sm" variant="ghost"><LogOut /> Quitter</Button></form>}</header><ChatRoom conversationId={id} currentUserId={session.user.id} initialMessages={initialMessages} initialHasMore={rawMessages.length > 100} /></div></div>;
}
