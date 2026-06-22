"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerAction } from "@/features/auth/actions";
import { TurnstileWidget } from "@/features/auth/turnstile-widget";
import { PowWidget } from "@/features/auth/pow-widget";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Rejoindre AfroCodeurs</h1>
        <p className="text-sm text-muted-foreground">
          Des problèmes aux solutions, ensemble.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom (optionnel)
          <input
            name="name"
            type="text"
            autoComplete="name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom d&apos;utilisateur
          <input
            name="username"
            type="text"
            required
            pattern="[a-z0-9_]+"
            placeholder="afromaker"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Mot de passe
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <TurnstileWidget />
        <PowWidget />

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Connexion
        </Link>
      </p>
    </div>
  );
}
