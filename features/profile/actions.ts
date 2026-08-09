"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { githubLoginFromUrl, orNull, parseList } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { profileSchema } from "@/lib/validators";

import { saveImage } from "@/lib/storage";

export type ProfileFormState = { error?: string; success?: boolean } | undefined;

/** Édition du profil AfroMaker (Sprint 1). Upsert le profil de l'utilisateur courant. */
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const g = await guard();
  if (!g.ok) return { error: g.error };

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

  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const p = parsed.data;
  const githubUrl = orNull(p.githubUrl);
  const data = {
    bio: orNull(p.bio),
    country: orNull(p.country),
    city: orNull(p.city),
    languages: p.languages,
    skills: p.skills,
    githubUrl,
    // Pont d'identité : déduit le login GitHub de l'URL (utilisé pour créditer
    // la réputation des tâches de roadmap, même sans connexion OAuth GitHub).
    githubLogin: githubLoginFromUrl(githubUrl),
    linkedinUrl: orNull(p.linkedinUrl),
    websiteUrl: orNull(p.websiteUrl),
    portfolioUrl: orNull(p.portfolioUrl),
  };

  await db.profile.upsert({
    where: { userId: g.user.id },
    create: { userId: g.user.id, ...data },
    update: data,
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}

/** Met à jour (ou retire) la photo de profil — enregistrée sous forme de fichier stocké. */
export async function updateAvatarAction(
  dataUrl: string | null,
): Promise<ProfileFormState> {
  const g = await guard();
  if (!g.ok) return { error: g.error };

  let imageUrl: string | null = null;

  if (dataUrl !== null) {
    if (dataUrl.startsWith("data:image/")) {
      if (dataUrl.length > 300_000) {
        return { error: "Image trop lourde." };
      }
      const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
      if (!match) {
        return { error: "Format d'image invalide." };
      }
      const contentType = match[1];
      const base64Data = match[2];
      try {
        const buffer = Buffer.from(base64Data, "base64");
        const bytes = new Uint8Array(buffer);
        imageUrl = await saveImage(bytes, contentType);
      } catch {
        return { error: "Échec du stockage de l'image." };
      }
    } else {
      imageUrl = dataUrl;
    }
  }

  await db.user.update({
    where: { id: g.user.id },
    data: { image: imageUrl },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/u/${g.user.username}`);
  return { success: true };
}
