"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createConversationAction } from "./actions";

const field = "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function NewConversationForm() {
  const [state, action, pending] = useActionState(createConversationAction, undefined);
  return <form action={action} className="flex flex-col gap-5">
    <label className="flex flex-col gap-1 text-sm font-medium">Membres<input name="usernames" required placeholder="codeurnwar, afromaker" autoCapitalize="none" className={field} /><span className="text-xs font-normal text-muted-foreground">Saisissez un ou plusieurs noms d’utilisateur, séparés par des virgules.</span></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Nom du groupe (optionnel)<input name="title" maxLength={80} placeholder="Ex. Équipe Défi Abidjan" className={field} /><span className="text-xs font-normal text-muted-foreground">Obligatoire uniquement lorsque vous invitez plusieurs personnes.</span></label>
    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Création…" : "Commencer la conversation"}</Button>
  </form>;
}
