"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { orNull, uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { communitySchema } from "@/lib/validators";
import { notify } from "@/features/notifications/notify";
import { award } from "@/features/reputation/award";

export type CommunityFormState = { error?: string } | undefined;

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
      members: { create: { userId: g.user.id, role: "ADMIN" } },
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

  await db.communityMember.deleteMany({
    where: { userId: g.user.id, communityId },
  });

  if (typeof slug === "string") revalidatePath(`/communities/${slug}`);
  revalidatePath("/dashboard/communities");
}
