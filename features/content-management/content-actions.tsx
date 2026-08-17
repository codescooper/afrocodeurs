"use client";

import { useActionState, useState } from "react";
import { History, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deleteUserContentAction, updateUserContentAction } from "./actions";

export function ContentActions({ entityType, entityId, title, body, returnPath }: { entityType: "QUESTION" | "ANSWER" | "COMMENT" | "KNOWLEDGE" | "PROBLEM"; entityId: string; title?: string; body: string; returnPath: string }) {
  const [state, action, pending] = useActionState(updateUserContentAction, undefined);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button type="button" size="sm" variant="ghost"><Pencil /> Modifier</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier le contenu</DialogTitle><DialogDescription>La version précédente restera visible dans votre historique d’activité.</DialogDescription></DialogHeader>
          <form action={action} className="grid gap-3">
            <input type="hidden" name="entityType" value={entityType} /><input type="hidden" name="entityId" value={entityId} /><input type="hidden" name="returnPath" value={returnPath} />
            {title !== undefined && <label className="grid gap-1 text-sm font-medium">Titre<input name="title" defaultValue={title} required minLength={5} maxLength={180} className="rounded-md border border-border bg-background px-3 py-2" /></label>}
            <label className="grid gap-1 text-sm font-medium">Contenu<textarea name="body" defaultValue={body} required minLength={2} rows={9} className="rounded-md border border-border bg-background px-3 py-2" /></label>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
          </form>
        </DialogContent>
      </Dialog>
      <form action={deleteUserContentAction} onSubmit={(event) => { if (!window.confirm("Supprimer définitivement ce contenu ? L’action restera dans l’historique.")) event.preventDefault(); }}>
        <input type="hidden" name="entityType" value={entityType} /><input type="hidden" name="entityId" value={entityId} /><input type="hidden" name="returnPath" value={returnPath} />
        <Button type="submit" size="sm" variant="ghost" className="text-destructive"><Trash2 /> Supprimer</Button>
      </form>
      <a href="/dashboard/activity" className="inline-flex items-center gap-1 text-muted-foreground hover:underline"><History className="size-3.5" /> Historique</a>
    </div>
  );
}
