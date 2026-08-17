import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ authenticated: false }, { status: 401 });
  const general = await db.conversation.upsert({
    where: { slug: "general" },
    create: { id: "afrocodeurs-general-chat", type: "GLOBAL", title: "Chat général", slug: "general" },
    update: {},
    select: { id: true, updatedAt: true },
  });
  const [memberships, communityMemberships] = await Promise.all([db.conversationMember.findMany({
    where: { userId: session.user.id },
    orderBy: { conversation: { updatedAt: "desc" } },
    take: 6,
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          id: true, title: true, type: true, updatedAt: true,
          members: { where: { userId: { not: session.user.id } }, take: 3, select: { user: { select: { username: true, name: true, image: true } } } },
          messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
        },
      },
    },
  }), db.communityMember.findMany({
    where: { userId: session.user.id, community: { chat: { isNot: null } } },
    select: { chatLastReadAt: true, community: { select: { name: true, chat: { select: { id: true, updatedAt: true, messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true } } } } } } },
  })]);
  const directConversations = await Promise.all(memberships.map(async ({ conversation, lastReadAt }) => ({
    id: conversation.id,
    title: conversation.title ?? conversation.members.map(({ user }) => user.name ?? `@${user.username}`).join(", "),
    image: conversation.members[0]?.user.image ?? null,
    preview: conversation.messages[0]?.body ?? "Nouvelle conversation",
    updatedAt: conversation.updatedAt.toISOString(),
    unread: await db.message.count({ where: { conversationId: conversation.id, createdAt: { gt: lastReadAt }, authorId: { not: session.user.id }, deletedAt: null } }),
  })));
  const communityConversations = await Promise.all(communityMemberships.flatMap(({ community, chatLastReadAt }) => community.chat ? [{
    id: community.chat.id,
    title: `Salon · ${community.name}`,
    image: null,
    preview: community.chat.messages[0]?.body ?? "Aucun message",
    updatedAt: community.chat.updatedAt.toISOString(),
    unread: db.message.count({ where: { conversationId: community.chat.id, createdAt: { gt: chatLastReadAt }, authorId: { not: session.user.id }, deletedAt: null } }),
  }] : []).map(async (item) => ({ ...item, unread: await item.unread })));
  const conversations = [...directConversations, ...communityConversations]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  return NextResponse.json({ authenticated: true, currentUserId: session.user.id, verified: session.user.isEmailVerified, general: general ? { id: general.id, updatedAt: general.updatedAt.toISOString() } : null, conversations });
}
