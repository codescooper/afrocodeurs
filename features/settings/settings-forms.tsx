"use client";

import { useActionState } from "react";

import { changePasswordAction, updateAccountAction } from "./actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire de mise à jour du nom affiché. */
export function AccountForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(
    updateAccountAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nom affiché
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={defaultName}
          className={inputClass}
        />
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-primary">Enregistré.</p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

/** Formulaire de changement de mot de passe. */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      {hasPassword && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Mot de passe actuel
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nouveau mot de passe
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-primary">Mot de passe mis à jour.</p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Mise à jour…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
