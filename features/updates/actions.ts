"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { notify } from "@/features/notifications/notify";
import { platformUpdateSchema } from "./validators";

export async function createPlatformUpdateAction(formData: FormData) {
  const g = await guard({ permission: "system:manage" });
  if (!g.ok) return;
  const parsed = platformUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const update = await db.platformUpdate.create({ data: { ...parsed.data, published: true, publishedAt: new Date() } });
  const users = await db.user.findMany({ where: { emailVerified: { not: null } }, select: { id: true }, take: 2000 });
  for (let index = 0; index < users.length; index += 50) {
    await Promise.all(users.slice(index, index + 50).map((user) => notify({ userId: user.id, actorId: g.user.id, type: "PLATFORM_UPDATE", title: update.title, body: update.summary, link: "/updates" })));
  }
  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function markPlatformUpdatesReadAction() {
  const g = await guard();
  if (!g.ok) return;
  const unread = await db.platformUpdate.findMany({ where: { published: true, reads: { none: { userId: g.user.id } } }, select: { id: true } });
  if (unread.length) await db.platformUpdateRead.createMany({ data: unread.map((update) => ({ updateId: update.id, userId: g.user.id })), skipDuplicates: true });
  revalidatePath("/updates");
  revalidatePath("/dashboard");
}
