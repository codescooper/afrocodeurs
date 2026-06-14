"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Ravi de vous revoir parmi les AfroMakers.
        </p>
      </div>

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
        <label className="flex flex-col gap-1 text-sm font-medium">
          Mot de passe
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <Link
          href="/forgot-password"
          className="-mt-1 self-end text-xs text-muted-foreground underline hover:text-foreground"
        >
          Mot de passe oublié ?
        </Link>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-foreground underline">
          Rejoindre
        </Link>
      </p>
    </div>
  );
}
