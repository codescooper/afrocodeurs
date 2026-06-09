"use client";

import { useActionState } from "react";

import { createQuestionAction } from "./actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire « poser une question » (Sprint 5). */
export function QuestionForm() {
  const [state, formAction, pending] = useActionState(
    createQuestionAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Titre
        <input
          name="title"
          type="text"
          required
          minLength={8}
          maxLength={160}
          placeholder="Comment déployer Next.js 16 sur un VPS ?"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Détails (Markdown)
        <textarea
          name="body"
          required
          minLength={20}
          rows={8}
          placeholder="Contexte, ce que vous avez essayé, messages d'erreur…"
          className={inputClass}
        />
      </label>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="lg" className="self-start">
        {pending ? "Publication…" : "Poser la question"}
      </Button>
    </form>
  );
}
