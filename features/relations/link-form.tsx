"use client";

import { useActionState } from "react";

import { linkToProblemAction } from "./actions";
import type { LinkCandidates } from "./queries";
import { Button } from "@/components/ui/button";

/** Lier une solution ou une ressource publiée au problème courant. */
export function LinkForm({
  problemId,
  slug,
  candidates,
}: {
  problemId: string;
  slug: string;
  candidates: LinkCandidates;
}) {
  const [state, formAction, pending] = useActionState(
    linkToProblemAction,
    undefined,
  );

  if (candidates.solutions.length === 0 && candidates.knowledge.length === 0) {
    return null;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="problemId" value={problemId} />
        <input type="hidden" name="slug" value={slug} />
        <select
          name="target"
          required
          defaultValue=""
          className="max-w-md flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="" disabled>
            Choisir une solution ou une ressource…
          </option>
          {candidates.solutions.length > 0 && (
            <optgroup label="Solutions (Atlas)">
              {candidates.solutions.map((s) => (
                <option key={s.id} value={`SOLUTION:${s.id}`}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          )}
          {candidates.knowledge.length > 0 && (
            <optgroup label="Ressources (Knowledge Hub)">
              {candidates.knowledge.map((k) => (
                <option key={k.id} value={`KNOWLEDGE:${k.id}`}>
                  {k.title}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Liaison…" : "Lier"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
