"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { addEntityCommentAction } from "./actions";

export function EntityCommentForm({ targetType, targetId, returnPath }: { targetType: string; targetId: string; returnPath: string }) {
  const [state, action, pending] = useActionState(addEntityCommentAction, undefined);
  return <ActionForm action={action} pending={pending} resetAfterSuccess={state?.success ? state : undefined} className="mt-6 grid gap-3">
    <input type="hidden" name="targetType" value={targetType} />
    <input type="hidden" name="targetId" value={targetId} />
    <input type="hidden" name="returnPath" value={returnPath} />
    <textarea name="body" aria-label="Votre commentaire" required minLength={2} maxLength={3000} rows={4} className="rounded-md border border-border bg-background p-3 text-sm" placeholder="Ajouter un commentaire…" />
    <Button disabled={pending} className="justify-self-start">{pending ? "Publication…" : "Publier"}</Button>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
  </ActionForm>;
}
