import type { Session } from "next-auth";
import type { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { can, VERIFY_EMAIL_MESSAGE, type Permission } from "@/lib/permissions";

export type SessionUser = Session["user"];

type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

/**
 * Garde commune des Server Actions : exige une session, et — en option — un
 * email vérifié et/ou une permission RBAC. Renvoie l'utilisateur si tout passe,
 * sinon un message d'erreur prêt à retourner depuis l'action. Les vérifications
 * suivent l'ordre connecté → email vérifié → permission.
 */
export async function guard(opts?: {
  permission?: Permission;
  verified?: boolean;
  messages?: { unauthenticated?: string; forbidden?: string };
}): Promise<GuardResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      error: opts?.messages?.unauthenticated ?? "Vous devez être connecté.",
    };
  }
  if (opts?.verified && !session.user.isEmailVerified) {
    return { ok: false, error: VERIFY_EMAIL_MESSAGE };
  }
  if (opts?.permission && !can(session.user.role, opts.permission)) {
    return {
      ok: false,
      error: opts?.messages?.forbidden ?? "Action non autorisée.",
    };
  }
  return { ok: true, user: session.user };
}

/** Premier message d'erreur d'un `safeParse` Zod échoué. */
export function invalidMessage(
  error: ZodError,
  fallback = "Données invalides.",
): string {
  return error.issues[0]?.message ?? fallback;
}
