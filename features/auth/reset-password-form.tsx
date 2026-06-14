"use client";

import { useActionState } from "react";
import Link from "next/link";

import { resetPasswordAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    undefined,
  );

  if (state?.done) {
    return (
      <p className="rounded-md border border-border bg-muted/40 p-4 text-sm">
        ✓ Mot de passe réinitialisé.{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Se connecter
        </Link>
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nouveau mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg">
        {pending ? "…" : "Réinitialiser le mot de passe"}
      </Button>
    </form>
  );
}
