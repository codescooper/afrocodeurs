"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { notify } from "@/features/notifications/notify";
import { createConversationSchema } from "./validators";

export type ConversationFormState = { error?: string } | undefined;

export async function createConversationAction(_: ConversationFormState, formData: FormData): Promise<ConversationFormState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = createConversationSchema.safeParse({ usernames: formData.get("usernames"), title: formData.get("title") || undefined });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  const usernames = [...new Set(parsed.data.usernames.split(/[\s,;]+/).map((name) => name.trim().toLowerCase()).filter(Boolean))].slice(0, 19);
  const recipients = await db.user.findMany({ where: { username: { in: usernames }, id: { not: g.user.id } }, select: { id: true, username: true } });
  const missing = usernames.filter((username) => !recipients.some((user) => user.username === username) && username !== g.user.username);
  if (missing.length) return { error: `Membre(s) introuvable(s) : ${missing.join(", ")}` };
  if (!recipients.length) return { error: "Ajoutez au moins un autre membre." };

  const memberIds = [g.user.id, ...recipients.map((user) => user.id)];
  const direct = memberIds.length === 2;
  const directKey = direct ? [...memberIds].sort().join(":") : null;
  if (directKey) {
    const existing = await db.conversation.findUnique({ where: { directKey }, select: { id: true } });
    if (existing) redirect(`/messages/${existing.id}`);
  }
  if (!direct && !parsed.data.title) return { error: "Donnez un nom à la conversation de groupe." };

  const conversation = await db.conversation.create({ data: {
    type: direct ? "DIRECT" : "GROUP",
    title: direct ? null : parsed.data.title,
    directKey,
    members: { create: memberIds.map((userId, index) => ({ userId, role: index === 0 ? "OWNER" : "MEMBER" })) },
  } });
  await Promise.all(recipients.map((recipient) => notify({ userId: recipient.id, actorId: g.user.id, type: "MESSAGE_NEW", title: direct ? "Nouvelle conversation" : `Nouveau groupe : ${parsed.data.title}`, body: `${g.user.username} vous invite à discuter.`, link: `/messages/${conversation.id}` })));
  redirect(`/messages/${conversation.id}`);
}

export async function leaveConversationAction(formData: FormData) {
  const g = await guard();
  if (!g.ok) return;
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await db.conversationMember.deleteMany({ where: { conversationId: id, userId: g.user.id } });
  revalidatePath("/messages");
  redirect("/messages");
}

export async function startDirectConversationAction(formData: FormData) {
  const g = await guard({ verified: true });
  if (!g.ok) redirect("/login");
  const recipientId = formData.get("recipientId");
  if (typeof recipientId !== "string" || recipientId === g.user.id) redirect("/messages");
  const recipient = await db.user.findUnique({ where: { id: recipientId }, select: { id: true } });
  if (!recipient) redirect("/messages");
  const memberIds = [g.user.id, recipient.id].sort();
  const directKey = memberIds.join(":");
  const existing = await db.conversation.findUnique({ where: { directKey }, select: { id: true } });
  if (existing) redirect(`/messages/${existing.id}`);
  const conversation = await db.conversation.create({
    data: { type: "DIRECT", directKey, members: { create: memberIds.map((userId) => ({ userId, role: userId === g.user.id ? "OWNER" : "MEMBER" })) } },
    select: { id: true },
  });
  redirect(`/messages/${conversation.id}`);
}
