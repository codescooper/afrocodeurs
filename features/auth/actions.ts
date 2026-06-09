"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { signInSchema, signUpSchema } from "@/lib/validators";

export type AuthFormState = { error?: string } | undefined;

/** Inscription email (Sprint 1). Crée l'utilisateur puis ouvre la session. */
export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { email, username, password, name } = parsed.data;

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  });
  if (existing) {
    return { error: "Cet email ou ce nom d'utilisateur est déjà pris." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { email, username, name, passwordHash },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
}

/** Connexion email / mot de passe (Sprint 1). */
export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email ou mot de passe invalide." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Identifiants incorrects." };
    }
    throw error; // laisse passer la redirection NEXT_REDIRECT
  }
}
