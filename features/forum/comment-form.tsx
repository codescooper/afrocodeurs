"use client";

import { useActionState } from "react";

import { addCommentAction } from "./actions";
import { cn } from "@/lib/utils";

const inputClass =
  "rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Champ de commentaire pour une question ou une réponse (Sprint 5). */
export function CommentForm({
  targetType,
  targetId,
  slug,
}: {
  targetType: "QUESTION" | "ANSWER";
  targetId: string;
  slug: string;
}) {
  const [state, formAction, pending] = useActionState(
    addCommentAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="slug" value={slug} />
        <input
          name="body"
          type="text"
          required
          minLength={2}
          maxLength={1000}
          placeholder="Ajouter un commentaire…"
          className={cn(inputClass, "flex-1")}
        />
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-medium text-foreground underline disabled:opacity-50"
        >
          {pending ? "…" : "Envoyer"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
