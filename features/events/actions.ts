"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { orNull, uniqueSlug } from "@/lib/utils";
import { notify } from "@/features/notifications/notify";
import { eventSchema } from "./validators";

export type EventFormState = { error?: string; success?: string } | undefined;

export async function createEventAction(_: EventFormState, formData: FormData): Promise<EventFormState> {
  const g = await guard({ verified: true }); if (!g.ok) return { error: g.error };
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  const d = parsed.data;
  if (d.communityId && !await db.communityMember.findUnique({ where: { userId_communityId: { userId: g.user.id, communityId: d.communityId } } })) return { error: "Vous devez appartenir à cette communauté." };
  const slug = await uniqueSlug(d.title, "evenement", async value => Boolean(await db.event.findUnique({ where: { slug: value }, select: { id: true } })));
  await db.event.create({ data: { title: d.title, slug, summary: d.summary, description: d.description, type: d.type, format: d.format, startsAt: d.startsAt, endsAt: d.endsAt, timezone: d.timezone, capacity: d.capacity ?? null, platform: orNull(d.platform), accessUrl: orNull(d.accessUrl), venue: orNull(d.venue), city: orNull(d.city), country: orNull(d.country), communityId: orNull(d.communityId), organizerId: g.user.id } });
  revalidatePath("/events"); redirect(`/events/${slug}`);
}

export async function toggleEventRegistrationAction(formData: FormData) {
  const g = await guard({ verified: true }); if (!g.ok) return;
  const id = String(formData.get("eventId") ?? "");
  const event = await db.event.findUnique({ where: { id }, include: { _count: { select: { registrations: true } } } });
  if (!event || event.status !== "PUBLISHED" || event.endsAt <= new Date()) return;
  const existing = await db.eventRegistration.findUnique({ where: { eventId_userId: { eventId: id, userId: g.user.id } } });
  if (existing) await db.eventRegistration.delete({ where: { id: existing.id } });
  else {
    if (event.capacity && event._count.registrations >= event.capacity) return;
    await db.eventRegistration.create({ data: { eventId: id, userId: g.user.id } });
    if (event.organizerId !== g.user.id) await notify({ userId: event.organizerId, actorId: g.user.id, type: "SYSTEM", title: "Nouvelle inscription", body: `@${g.user.username} participera à « ${event.title} ».`, link: `/events/${event.slug}` });
  }
  revalidatePath(`/events/${event.slug}`); revalidatePath("/events");
}
