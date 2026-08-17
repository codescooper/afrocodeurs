"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { orNull, uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { communitySchema } from "@/lib/validators";
import { notify } from "@/features/notifications/notify";
import { award } from "@/features/reputation/award";
import { recordAudit } from "@/features/audit/log";
import { can } from "@/lib/permissions";

export type CommunityFormState = { error?: string } | undefined;

function geoKey(country?: string, city?: string) {
  const clean = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("fr").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const aliases: Record<string, string> = { congo: "cg", "congo-brazzaville": "cg", "republique-du-congo": "cg", rdc: "cd", "congo-kinshasa": "cd", "republique-democratique-du-congo": "cd" };
  const normalizedCountry = country ? (aliases[clean(country)] ?? clean(country)) : null;
  return normalizedCountry ? `${normalizedCountry}:${city ? clean(city) : "national"}` : null;
}

async function existingGeoCommunity(country: string, city?: string, exceptId?: string) {
  const wanted = geoKey(country, city);
  const communities = await db.community.findMany({ where: { type: "GEO", ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true, slug: true, name: true, country: true, city: true, geoKey: true } });
  return communities.find(item => (item.geoKey ?? geoKey(item.country ?? undefined, item.city ?? undefined)) === wanted);
}

async function canManageCommunity(userId: string, role: Parameters<typeof can>[0], communityId: string) {
  if (can(role, "community:manage")) return true;
  const membership = await db.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId } },
    select: { role: true },
  });
  return membership?.role === "ADMIN";
}

/** Création d'une communauté (Sprint 2). Le créateur en devient ADMIN. */
export async function createCommunityAction(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const g = await guard({ permission: "community:create", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
  });

  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const { name, description, type, country, city } = parsed.data;
  if (type === "GEO" && !country) return { error: "Le pays est obligatoire pour une communauté géographique." };
  if (type === "GEO") {
    const existing = await existingGeoCommunity(country!, city);
    if (existing) return { error: `La communauté géographique « ${existing.name} » existe déjà. Rejoignez-la ou proposez votre aide à son équipe.` };
  }
  const slug = await uniqueSlug(name, "communaute", async (s) =>
    Boolean(
      await db.community.findUnique({ where: { slug: s }, select: { id: true } }),
    ),
  );

  await db.community.create({
    data: {
      name,
      slug,
      description: orNull(description),
      type,
      country: orNull(country),
      city: orNull(city),
      geoKey: type === "GEO" ? geoKey(country, city) : null,
      members: { create: { userId: g.user.id, role: "ADMIN" } },
      chat: { create: { type: "GROUP", title: `Salon · ${name}` } },
    },
  });

  revalidatePath("/communities");
  redirect(`/communities/${slug}`);
}

/** Rejoindre une communauté (idempotent). */
export async function joinCommunityAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (!g.ok) return;

  const communityId = formData.get("communityId");
  const slug = formData.get("slug");
  if (typeof communityId !== "string") return;

  const existing = await db.communityMember.findUnique({
    where: { userId_communityId: { userId: g.user.id, communityId } },
    select: { id: true },
  });

  if (!existing) {
    await db.communityMember.create({
      data: { userId: g.user.id, communityId, role: "MEMBER" },
    });
    await award(g.user.id, "COMMUNITY_JOINED", {
      type: "COMMUNITY",
      id: communityId,
    });

    // Notifier les responsables (ADMIN) de la communauté.
    const [community, admins] = await Promise.all([
      db.community.findUnique({
        where: { id: communityId },
        select: { name: true },
      }),
      db.communityMember.findMany({
        where: { communityId, role: "ADMIN" },
        select: { userId: true },
      }),
    ]);
    for (const admin of admins) {
      await notify({
        userId: admin.userId,
        actorId: g.user.id,
        type: "COMMUNITY_JOIN",
        title: "Nouveau membre dans ta communauté",
        body: `Quelqu'un a rejoint « ${community?.name ?? "ta communauté"} ».`,
        link: typeof slug === "string" ? `/communities/${slug}` : null,
      });
    }
  }

  if (typeof slug === "string") revalidatePath(`/communities/${slug}`);
  revalidatePath("/dashboard/communities");
}

/** Quitter une communauté (idempotent). */
export async function leaveCommunityAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (!g.ok) return;

  const communityId = formData.get("communityId");
  const slug = formData.get("slug");
  if (typeof communityId !== "string") return;

  const membership = await db.communityMember.findUnique({
    where: { userId_communityId: { userId: g.user.id, communityId } },
    select: { role: true },
  });
  if (membership?.role === "ADMIN") {
    const adminCount = await db.communityMember.count({
      where: { communityId, role: "ADMIN" },
    });
    if (adminCount <= 1) return;
  }

  await db.communityMember.deleteMany({
    where: { userId: g.user.id, communityId },
  });

  if (typeof slug === "string") revalidatePath(`/communities/${slug}`);
  revalidatePath("/dashboard/communities");
}

/** Met à jour une communauté. Réservé à ses administrateurs ou au staff. */
export async function updateCommunityAction(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };

  const id = formData.get("id");
  if (typeof id !== "string" || !(await canManageCommunity(g.user.id, g.user.role, id))) {
    return { error: "Vous ne pouvez pas modifier cette communauté." };
  }

  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
  });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const before = await db.community.findUnique({ where: { id } });
  if (!before) return { error: "Communauté introuvable." };

  if (parsed.data.type === "GEO" && !parsed.data.country) return { error: "Le pays est obligatoire pour une communauté géographique." };
  if (parsed.data.type === "GEO") {
    const existing = await existingGeoCommunity(parsed.data.country!, parsed.data.city, id);
    if (existing) return { error: `La communauté géographique « ${existing.name} » existe déjà.` };
  }
  const data = {
    name: parsed.data.name,
    description: orNull(parsed.data.description),
    type: parsed.data.type,
    country: orNull(parsed.data.country),
    city: orNull(parsed.data.city),
    geoKey: parsed.data.type === "GEO" ? geoKey(parsed.data.country, parsed.data.city) : null,
  };
  await db.community.update({ where: { id }, data });
  await recordAudit({
    actorId: g.user.id,
    action: "UPDATE",
    entityType: "COMMUNITY",
    entityId: id,
    before: { name: before.name, description: before.description, type: before.type, country: before.country, city: before.city },
    after: data,
  });

  revalidatePath(`/communities/${before.slug}`);
  revalidatePath("/communities");
  revalidatePath("/dashboard/communities");
  redirect(`/communities/${before.slug}`);
}

/** Supprime une communauté avec confirmation explicite et historique d'audit. */
export async function deleteCommunityAction(formData: FormData): Promise<void> {
  const g = await guard({ verified: true });
  if (!g.ok) return;

  const id = formData.get("id");
  const confirmation = formData.get("confirmation");
  if (typeof id !== "string" || confirmation !== "SUPPRIMER") return;
  if (!(await canManageCommunity(g.user.id, g.user.role, id))) return;

  const before = await db.community.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, description: true, type: true, country: true, city: true },
  });
  if (!before) return;

  await db.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        actorId: g.user.id,
        action: "DELETE",
        entityType: "COMMUNITY",
        entityId: id,
        before,
      },
    });
    await tx.community.delete({ where: { id } });
  });

  revalidatePath("/communities");
  revalidatePath("/dashboard/communities");
  redirect("/communities");
}

/** Gère le rôle, la suspension du salon ou le retrait d'un membre. */
export async function manageCommunityMemberAction(formData: FormData): Promise<void> {
  const g = await guard({ verified: true });
  if (!g.ok) return;
  const communityId = formData.get("communityId");
  const memberId = formData.get("memberId");
  const slug = formData.get("slug");
  const decision = formData.get("decision");
  if (typeof communityId !== "string" || typeof memberId !== "string" || typeof slug !== "string" || typeof decision !== "string") return;
  if (!(await canManageCommunity(g.user.id, g.user.role, communityId))) return;

  const target = await db.communityMember.findFirst({ where: { id: memberId, communityId }, select: { id: true, userId: true, role: true, chatMutedUntil: true } });
  if (!target) return;
  if ((decision === "remove" || decision === "member") && target.role === "ADMIN") {
    const admins = await db.communityMember.count({ where: { communityId, role: "ADMIN" } });
    if (admins <= 1) return;
  }

  if (decision === "remove") {
    await db.communityMember.delete({ where: { id: target.id } });
  } else if (decision === "admin" || decision === "moderator" || decision === "member") {
    const role = decision === "admin" ? "ADMIN" : decision === "moderator" ? "MODERATOR" : "MEMBER";
    await db.communityMember.update({ where: { id: target.id }, data: { role } });
  } else if (decision === "mute") {
    await db.communityMember.update({ where: { id: target.id }, data: { chatMutedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  } else if (decision === "unmute") {
    await db.communityMember.update({ where: { id: target.id }, data: { chatMutedUntil: null } });
  } else return;

  await recordAudit({ actorId: g.user.id, action: "UPDATE", entityType: "COMMUNITY", entityId: communityId, metadata: { memberId, decision } });
  revalidatePath(`/communities/${slug}`);
  revalidatePath(`/communities/${slug}/edit`);
}
