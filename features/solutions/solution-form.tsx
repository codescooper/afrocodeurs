"use client";

import { useActionState } from "react";

import { createSolutionAction } from "./actions";
import { SOLUTION_TYPE_LABELS, SOLUTION_TYPES } from "./constants";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire de proposition d'une solution (Sprint 6). */
export function SolutionForm() {
  const [state, formAction, pending] = useActionState(
    createSolutionAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Type
          <select name="type" defaultValue="SOFTWARE" className={inputClass}>
            {SOLUTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {SOLUTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          name="description"
          required
          rows={5}
          minLength={20}
          placeholder="Que fait cette solution ? Pour quels usages ?"
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pays
          <input name="country" type="text" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Licence
          <input
            name="license"
            type="text"
            placeholder="MIT, propriétaire…"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Site web
          <input
            name="websiteUrl"
            type="url"
            placeholder="https://…"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Documentation
          <input
            name="documentationUrl"
            type="url"
            placeholder="https://…"
            className={inputClass}
          />
        </label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Publication…" : "Ajouter à l'Atlas"}
      </Button>
    </form>
  );
}
