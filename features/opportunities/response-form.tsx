"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { respondToOpportunityAction } from "./actions";

export function OpportunityResponseForm({ opportunityId, initialKind }: { opportunityId: string; initialKind?: "INTEREST" | "APPLICATION" }) {
  const [state, action, pending] = useActionState(respondToOpportunityAction, undefined);
  const [applying, setApplying] = useState(initialKind === "APPLICATION");
  return <form action={action} className="rounded-xl border border-border bg-muted/30 p-5">
    <input type="hidden" name="opportunityId" value={opportunityId} />
    <h2 className="font-semibold">Cette opportunité vous intéresse ?</h2>
    {applying && <label className="mt-4 flex flex-col gap-1 text-sm font-medium">Votre message<textarea name="message" maxLength={2000} rows={5} placeholder="Présentez brièvement votre profil et votre motivation…" className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>}
    {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
    {state?.success && <p className="mt-3 text-sm font-medium text-green-700 dark:text-green-400">{state.success}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="submit" name="kind" value="INTEREST" variant={applying ? "outline" : "primary"} disabled={pending}>Je suis intéressé·e</Button>
      <Button type="button" variant={applying ? "primary" : "outline"} onClick={() => setApplying(true)}>Postuler</Button>
      {applying && <Button type="submit" name="kind" value="APPLICATION" disabled={pending}>{pending ? "Envoi…" : "Envoyer ma candidature"}</Button>}
    </div>
  </form>;
}
