"use client";

import { useActionState } from "react";

import { createCommunityAction } from "./actions";
import { COMMUNITY_TYPE_LABELS, COMMUNITY_TYPES } from "./constants";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire de création d'une communauté (Sprint 2). */
export function CommunityForm() {
  const [state, formAction, pending] = useActionState(
    createCommunityAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nom
        <input
          name="name"
          type="text"
          required
          minLength={3}
          maxLength={80}
          placeholder="React Afrique francophone"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Type
        <select
          name="type"
          required
          defaultValue="SKILL"
          className={inputClass}
        >
          {COMMUNITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {COMMUNITY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          placeholder="À qui s'adresse cette communauté ?"
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pays
          <input name="country" type="text" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Ville
          <input name="city" type="text" className={inputClass} />
        </label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Création…" : "Créer la communauté"}
      </Button>
    </form>
  );
}
