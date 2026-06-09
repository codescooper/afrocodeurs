"use client";

import { useActionState } from "react";

import { createReportAction } from "./actions";
import { REPORT_REASON_LABELS, REPORT_REASONS } from "./constants";

const controlClass =
  "rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary";

/** Contrôle de signalement repliable, réutilisable sur tout contenu (Sprint 8). */
export function ReportForm({
  targetType,
  targetId,
}: {
  targetType: string;
  targetId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createReportAction,
    undefined,
  );

  if (state?.success) {
    return (
      <p className="text-xs text-muted-foreground">Signalement envoyé. Merci.</p>
    );
  }

  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
        Signaler
      </summary>
      <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <select name="reason" className={controlClass}>
          {REPORT_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REPORT_REASON_LABELS[reason]}
            </option>
          ))}
        </select>
        <input
          name="details"
          type="text"
          maxLength={500}
          placeholder="Précisions (optionnel)"
          className={controlClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs font-medium text-destructive underline disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Envoyer"}
        </button>
        {state?.error && (
          <p className="w-full text-xs text-destructive">{state.error}</p>
        )}
      </form>
    </details>
  );
}
