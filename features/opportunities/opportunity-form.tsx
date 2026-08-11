"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createOpportunityAction } from "./actions";
import { OPPORTUNITY_TYPES, OPPORTUNITY_TYPE_LABELS } from "./constants";

const field = "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function OpportunityForm() {
  const [state, action, pending] = useActionState(createOpportunityAction, undefined);
  return <form action={action} className="flex flex-col gap-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium">Titre<input name="title" required minLength={5} maxLength={160} className={field} /></label>
      <label className="flex flex-col gap-1 text-sm font-medium">Organisation<input name="organization" required maxLength={120} className={field} /></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium">Type<select name="type" className={field}>{OPPORTUNITY_TYPES.map((type) => <option key={type} value={type}>{OPPORTUNITY_TYPE_LABELS[type]}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-sm font-medium">Lieu<input name="location" maxLength={120} placeholder="Abidjan, Côte d’Ivoire" className={field} /></label>
    </div>
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isRemote" value="true" /> Accessible à distance</label>
    <label className="flex flex-col gap-1 text-sm font-medium">Résumé<textarea name="summary" required minLength={20} maxLength={320} rows={3} className={field} /></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Description détaillée<textarea name="description" required minLength={50} maxLength={12000} rows={9} placeholder="Mission, contexte, avantages, déroulement…" className={field} /></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Prérequis (optionnel)<textarea name="requirements" maxLength={6000} rows={5} className={field} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium">Date limite<input name="deadline" type="date" className={field} /></label>
      <label className="flex flex-col gap-1 text-sm font-medium">Lien externe (optionnel)<input name="externalUrl" type="url" placeholder="https://…" className={field} /></label>
    </div>
    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" size="lg" disabled={pending} className="self-start">{pending ? "Publication…" : "Publier l’opportunité"}</Button>
  </form>;
}
