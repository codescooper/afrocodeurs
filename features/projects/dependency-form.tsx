"use client";

import { useActionState } from "react";

import { addDependencyAction } from "./actions";
import { Button } from "@/components/ui/button";

const selectClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

type TaskOption = { id: string; githubNumber: number; title: string };

/** Déclarer qu'une tâche en bloque une autre (arête du DAG, mainteneur). */
export function DependencyForm({
  projectId,
  slug,
  tasks,
}: {
  projectId: string;
  slug: string;
  tasks: TaskOption[];
}) {
  const [state, formAction, pending] = useActionState(
    addDependencyAction,
    undefined,
  );

  if (tasks.length < 2) return null;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium">
          La tâche
          <select name="taskId" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              choisir…
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.githubNumber} — {t.title}
              </option>
            ))}
          </select>
        </label>
        <span className="pb-2 text-xs text-muted-foreground">dépend de</span>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Le prérequis
          <select
            name="dependsOnId"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="" disabled>
              choisir…
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.githubNumber} — {t.title}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
