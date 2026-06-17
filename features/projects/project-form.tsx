"use client";

import { useActionState } from "react";

import { createProjectAction } from "./actions";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "./constants";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire de référencement d'un projet (branche la roadmap sur un dépôt GitHub). */
export function ProjectForm({
  problems,
  communities,
}: {
  problems: { id: string; title: string }[];
  communities: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nom du projet
        <input
          name="name"
          type="text"
          required
          minLength={5}
          maxLength={120}
          placeholder="Plateforme de télémédecine rurale"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          name="description"
          required
          rows={5}
          minLength={20}
          placeholder="Que construit ce projet, pour qui, et où en est-il ?"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Dépôt GitHub
        <input
          name="githubRepo"
          type="text"
          required
          pattern="[\w.\-]+/[\w.\-]+"
          placeholder="org/depot"
          className={inputClass}
        />
        <span className="text-xs font-normal text-muted-foreground">
          Format <code>org/depot</code>. La roadmap (tâches, phases, qui fait
          quoi) sera synchronisée depuis les issues et milestones de ce dépôt.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Statut
          <select name="status" defaultValue="IDEA" className={inputClass}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Site / lien (optionnel)
          <input
            name="websiteUrl"
            type="url"
            placeholder="https://…"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Problème résolu (optionnel)
          <select name="problemId" defaultValue="" className={inputClass}>
            <option value="">— Aucun —</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Communauté / équipe (optionnel)
          <select name="communityId" defaultValue="" className={inputClass}>
            <option value="">— Aucune —</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Création…" : "Référencer le projet"}
      </Button>
    </form>
  );
}
