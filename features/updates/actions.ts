"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { notifyPublishedUpdate } from "./publish";
import { platformUpdateSchema } from "./validators";

export async function createPlatformUpdateAction(formData: FormData) {
  const g = await guard({ permission: "system:manage" });
  if (!g.ok) return;
  const parsed = platformUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const update = await db.platformUpdate.create({ data: { ...parsed.data, published: true, publishedAt: new Date() } });
  await notifyPublishedUpdate(update, g.user.id);
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
