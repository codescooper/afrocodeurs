"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordResetAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          On t&apos;envoie un lien pour en choisir un nouveau.
        </p>
      </div>

      {state?.done ? (
        <p className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Si un compte existe pour cet email, un lien de réinitialisation vient
          d&apos;être envoyé. Pense à vérifier tes spams.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Envoi…" : "Envoyer le lien"}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
