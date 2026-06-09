"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { communitySchema } from "@/lib/validators";

export type CommunityFormState = { error?: string } | undefined;

/** Normalise une chaîne optionnelle : "" → null. */
function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Génère un slug unique à partir du nom (suffixe -2, -3… en cas de collision). */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "communaute";
  let slug = root;
  let n = 2;
  while (
    await db.community.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

/** Création d'une communauté (Sprint 2). Le créateur en devient ADMIN. */
export async function createCommunityAction(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "community:create")) {
    return { error: "Action non autorisée." };
  }

  const parsed = communitySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { name, description, type, country, city } = parsed.data;
  const slug = await uniqueSlug(name);

  await db.community.create({
    data: {
      name,
      slug,
      description: orNull(description),
      type,
      country: orNull(country),
      city: orNull(city),
      members: { create: { userId: session.user.id, role: "ADMIN" } },
    },
  });

  revalidatePath("/communities");
  redirect(`/communities/${slug}`);
}

/** Rejoindre une communauté (idempotent). */
export async function joinCommunityAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const communityId = formData.get("communityId");
  const slug = formData.get("slug");
  if (typeof communityId !== "string") return;

  await db.communityMember.upsert({
    where: { userId_communityId: { userId: session.user.id, communityId } },
    create: { userId: session.user.id, communityId, role: "MEMBER" },
    update: {},
  });

  if (typeof slug === "string") revalidatePath(`/communities/${slug}`);
  revalidatePath("/dashboard/communities");
}

/** Quitter une communauté (idempotent). */
export async function leaveCommunityAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const communityId = formData.get("communityId");
  const slug = formData.get("slug");
  if (typeof communityId !== "string") return;

  await db.communityMember.deleteMany({
    where: { userId: session.user.id, communityId },
  });

  if (typeof slug === "string") revalidatePath(`/communities/${slug}`);
  revalidatePath("/dashboard/communities");
}
