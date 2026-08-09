"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitChallengeAnswer } from "./actions";

export function AnswerForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(submitChallengeAnswer, undefined);
  return <form action={action} className="rounded-xl border border-primary/30 bg-primary/5 p-5">
    <input type="hidden" name="id" value={id} />
    <label className="text-sm font-semibold">Votre réponse<div className="mt-2 flex gap-2"><input name="answer" required autoComplete="off" className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3" /><Button type="submit" disabled={pending}>{pending ? "Vérification…" : "Valider"}</Button></div></label>
    {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
    {state?.success && <p className="mt-3 text-sm font-semibold text-green-700">{state.success}</p>}
  </form>;
}
