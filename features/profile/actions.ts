"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validators";

export type ProfileFormState = { error?: string; success?: boolean } | undefined;

/** Transforme une saisie « a, b, c » en tableau nettoyé (sans doublons vides). */
function parseList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Normalise une chaîne optionnelle : "" → null pour garder la base propre. */
function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Édition du profil AfroMaker (Sprint 1). Upsert le profil de l'utilisateur courant. */
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };

  const parsed = profileSchema.safeParse({
    bio: formData.get("bio") || undefined,
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
    languages: parseList(formData.get("languages")),
    skills: parseList(formData.get("skills")),
    githubUrl: formData.get("githubUrl") || "",
    linkedinUrl: formData.get("linkedinUrl") || "",
    websiteUrl: formData.get("websiteUrl") || "",
    portfolioUrl: formData.get("portfolioUrl") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const p = parsed.data;
  const data = {
    bio: orNull(p.bio),
    country: orNull(p.country),
    city: orNull(p.city),
    languages: p.languages,
    skills: p.skills,
    githubUrl: orNull(p.githubUrl),
    linkedinUrl: orNull(p.linkedinUrl),
    websiteUrl: orNull(p.websiteUrl),
    portfolioUrl: orNull(p.portfolioUrl),
  };

  await db.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}
