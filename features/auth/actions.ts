"use server";

import { randomBytes } from "node:crypto";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validators";

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

export type PasswordResetState =
  | { error?: string; done?: boolean }
  | undefined;

/** Demande de réinitialisation : envoie un lien par email (valable 1 h). */
export async function requestPasswordResetAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Email invalide." };
  const email = parsed.data.email.toLowerCase();

  const user = await db.user.findUnique({
    where: { email },
    select: { name: true },
  });

  // On ne révèle jamais si l'email existe (sécurité).
  if (user) {
    const token = randomBytes(32).toString("hex");
    const identifier = `reset:${email}`;
    await db.verificationToken.deleteMany({ where: { identifier } });
    await db.verificationToken.create({
      data: { identifier, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = `${base}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Réinitialise ton mot de passe AfroCodeurs",
      text: `Bonjour${user.name ? " " + user.name : ""},\n\nPour réinitialiser ton mot de passe (lien valable 1 h) :\n${url}\n\nSi tu n'es pas à l'origine de cette demande, ignore cet email.`,
      html: `<p>Bonjour${user.name ? " " + user.name : ""},</p><p>Pour réinitialiser ton mot de passe (lien valable 1&nbsp;h), clique ici :</p><p><a href="${url}">${url}</a></p><p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>`,
    });
  }

  return { done: true };
}

/** Réinitialisation effective via le token reçu par email. */
export async function resetPasswordAction(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) return { error: "Lien invalide." };

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." };
  }

  const record = await db.verificationToken.findUnique({ where: { token } });
  if (
    !record ||
    !record.identifier.startsWith("reset:") ||
    record.expires < new Date()
  ) {
    return { error: "Lien invalide ou expiré. Refais une demande." };
  }

  const email = record.identifier.slice("reset:".length);
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.update({ where: { email }, data: { passwordHash } });
  await db.verificationToken.deleteMany({
    where: { identifier: record.identifier },
  });

  return { done: true };
}
