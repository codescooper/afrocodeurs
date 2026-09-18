"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addNewsletterSubscriberAction } from "./newsletter-actions";

export function NewsletterAddForm() {
  const [state, action, pending] = useActionState(
    addNewsletterSubscriberAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
        Ajouter une adresse
        <Input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="membre@exemple.com"
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter"}
      </Button>
      <p className="text-sm sm:max-w-64" aria-live="polite">
        {state?.error && <span className="text-destructive">{state.error}</span>}
        {state?.success && <span className="text-emerald-600">{state.success}</span>}
      </p>
    </form>
  );
}
