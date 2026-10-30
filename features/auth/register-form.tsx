"use client";

import { ActionForm } from "@/components/shared/action-form";
import { useActionState, useState } from "react";
import Link from "next/link";

import { registerAction } from "@/features/auth/actions";
import { TurnstileWidget } from "@/features/auth/turnstile-widget";
import { PowWidget } from "@/features/auth/pow-widget";
import { Button } from "@/components/ui/button";

export function RegisterForm({ turnstileSiteKey, powEnabled }: {
  turnstileSiteKey: string | null;
  powEnabled: boolean;
}) {
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [powReady, setPowReady] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(!turnstileSiteKey);
  const [fields, setFields] = useState({ name: "", username: "", email: "", password: "" });
  const [state, formAction, pending] = useActionState(async (
    previous: Awaited<ReturnType<typeof registerAction>>, data: FormData,
  ) => {
    const result = await registerAction(previous, data);
    // Both proofs may have been consumed before a later validation error.
    if (result?.error) {
      setPowReady(false);
      setCaptchaReady(!turnstileSiteKey);
      setVerificationAttempt((attempt) => attempt + 1);
    }
    return result;
  }, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Rejoindre AfroCodeurs</h1>
        <p className="text-sm text-muted-foreground">
          Des problèmes aux solutions, ensemble.
        </p>
      </div>

      <ActionForm action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom (optionnel)
          <input
            name="name"
            value={fields.name}
            onChange={(event) => setFields((v) => ({ ...v, name: event.target.value }))}
            type="text"
            autoComplete="name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom d&apos;utilisateur
          <input
            name="username"
            value={fields.username}
            onChange={(event) => setFields((v) => ({ ...v, username: event.target.value.toLowerCase() }))}
            type="text"
            required
            pattern="[a-z0-9_]+"
            placeholder="afromaker"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs font-normal text-muted-foreground" aria-live="polite">
            Les majuscules sont automatiquement converties en minuscules.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            name="email"
            value={fields.email}
            onChange={(event) => setFields((v) => ({ ...v, email: event.target.value }))}
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
            value={fields.password}
            onChange={(event) => setFields((v) => ({ ...v, password: event.target.value }))}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <TurnstileWidget key={`captcha-${verificationAttempt}`} siteKey={turnstileSiteKey} onReadyChange={setCaptchaReady} />
        <PowWidget key={`pow-${verificationAttempt}`} enabled={powEnabled} onReadyChange={setPowReady} />

        {state?.error && (
          <p role="alert" className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending || !captchaReady || !powReady} size="lg">
          {pending
            ? "Création…"
            : !captchaReady ? "Vérification Cloudflare…"
              : !powReady ? "Vérification anti-robot…" : "Créer mon compte"}
        </Button>
      </ActionForm>

      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Connexion
        </Link>
      </p>
    </div>
  );
}
