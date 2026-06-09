"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountSchema, changePasswordSchema } from "@/lib/validators";

export type SettingsFormState =
  | { error?: string; success?: boolean }
  | undefined;

/** Mise à jour du nom affiché (Sprint 1 / réglages compte). */
export async function updateAccountAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const parsed = accountSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/** Changement de mot de passe. Vérifie l'actuel si l'utilisateur en a un. */
export async function changePasswordAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Utilisateur introuvable." };

  if (user.passwordHash) {
    const valid =
      !!parsed.data.currentPassword &&
      (await bcrypt.compare(parsed.data.currentPassword, user.passwordHash));
    if (!valid) return { error: "Mot de passe actuel incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return { success: true };
}

/** Déconnexion. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
