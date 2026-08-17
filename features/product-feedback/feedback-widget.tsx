"use client";

import { useActionState } from "react";
import { usePathname } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { submitProductFeedbackAction } from "./actions";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(submitProductFeedbackAction, undefined);
  return (
    <Dialog>
      <DialogTrigger asChild><Button type="button" variant="outline" size="sm" className="fixed bottom-20 left-4 z-40 rounded-full bg-background shadow-lg md:bottom-5"><Lightbulb /> Améliorer AfroCodeurs</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Une idée ou un manque ?</DialogTitle><DialogDescription>Décrivez ce qui vous bloque ou ce qui rendrait la plateforme meilleure. La demande sera analysée puis validée humainement avant de devenir un objectif de développement.</DialogDescription></DialogHeader>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="sourceUrl" value={pathname} />
          <label className="grid gap-1 text-sm font-medium">Titre<input name="title" required minLength={8} maxLength={180} placeholder="Ex. Il manque un bouton pour…" className="rounded-md border border-border bg-background px-3 py-2" /></label>
          <label className="grid gap-1 text-sm font-medium">Description<textarea name="description" required minLength={20} maxLength={5000} rows={7} placeholder="Contexte, personnes concernées et résultat attendu…" className="rounded-md border border-border bg-background px-3 py-2" /></label>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-accent">{state.success}</p>}
          <Button disabled={pending}>{pending ? "Analyse…" : "Envoyer la demande"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
