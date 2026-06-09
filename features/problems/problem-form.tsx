"use client";

import { useActionState } from "react";

import { createProblemAction } from "./actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

const LEVELS = [1, 2, 3, 4, 5];

/** Formulaire de proposition d'un problème (Sprint 3). */
export function ProblemForm() {
  const [state, formAction, pending] = useActionState(
    createProblemAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Titre
        <input
          name="title"
          type="text"
          required
          minLength={5}
          maxLength={140}
          placeholder="Accès limité au diagnostic médical en zone rurale"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Résumé (optionnel)
        <input
          name="summary"
          type="text"
          maxLength={280}
          placeholder="Une phrase pour situer le problème."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <textarea
          name="description"
          required
          rows={6}
          minLength={20}
          placeholder="Contexte, personnes touchées, conséquences, pistes…"
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Secteur
          <input
            name="sector"
            type="text"
            required
            placeholder="Santé, Agriculture, Éducation…"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Pays concernés (séparés par des virgules)
          <input
            name="countries"
            type="text"
            placeholder="Sénégal, Mali, Bénin"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Niveau d&apos;impact
          <select name="impactLevel" defaultValue="3" className={inputClass}>
            {LEVELS.map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Niveau de difficulté
          <select name="difficultyLevel" defaultValue="3" className={inputClass}>
            {LEVELS.map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Publication…" : "Proposer le problème"}
      </Button>
    </form>
  );
}
