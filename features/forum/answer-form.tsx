"use client";

import { useActionState } from "react";

import { createAnswerAction } from "./actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Formulaire de réponse à une question (Sprint 5). */
export function AnswerForm({
  questionId,
  slug,
}: {
  questionId: string;
  slug: string;
}) {
  const [state, formAction, pending] = useActionState(
    createAnswerAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="body"
        required
        minLength={10}
        rows={5}
        placeholder="Votre réponse (Markdown supporté)…"
        className={inputClass}
      />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Envoi…" : "Répondre"}
      </Button>
    </form>
  );
}
