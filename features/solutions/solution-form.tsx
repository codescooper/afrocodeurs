"use client";

import { ActionForm } from "@/components/shared/action-form";
import { useActionState } from "react";

import { createSolutionAction } from "./actions";
import { SOLUTION_TYPE_LABELS, SOLUTION_TYPES } from "./constants";
import { Button } from "@/components/ui/button";
import { CatalogFields } from "./catalog-fields";
import { updateSolutionCatalogAction } from "./catalog-actions";
import type { Solution } from "@prisma/client";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire de proposition d'une solution (Sprint 6). */
export function SolutionForm({ solution }: { solution?: Solution }) {
  const [state, formAction, pending] = useActionState(
    solution ? updateSolutionCatalogAction : createSolutionAction,
    undefined,
  );

  return (
    <ActionForm action={formAction} className="flex max-w-2xl flex-col gap-4">
      {solution && <><input type="hidden" name="id" value={solution.id} /><input type="hidden" name="revision" value={solution.revision} /></>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom
          <input
            name="name"
            defaultValue={solution?.name}
            type="text"
            required
            minLength={2}
            maxLength={120}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Type
          <select name="type" defaultValue={solution?.type ?? "SOFTWARE"} className={inputClass}>
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
          defaultValue={solution?.description}
          required
          rows={5}
          minLength={20}
          placeholder="Que fait cette solution ? Pour quels usages ?"
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pays d’origine déclaré
          <input name="country" type="text" defaultValue={solution?.country ?? ""} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Licence
          <input
            name="license"
            defaultValue={solution?.license ?? ""}
            type="text"
            placeholder="MIT, propriétaire…"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Site web
          <input
            name="websiteUrl"
            defaultValue={solution?.websiteUrl ?? ""}
            type="url"
            placeholder="https://…"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Documentation
          <input
            name="documentationUrl"
            defaultValue={solution?.documentationUrl ?? ""}
            type="url"
            placeholder="https://…"
            className={inputClass}
          />
        </label>
      </div>

      <CatalogFields values={solution} />
      {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state && "success" in state && <p role="status" className="text-sm">{String(state.success)}</p>}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Enregistrement…" : solution ? "Enregistrer les modifications" : "Ajouter à l'Atlas"}
      </Button>
    </ActionForm>
  );
}
