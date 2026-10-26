"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { inviteSolutionManagerAction, respondSolutionInvitationAction, removeSolutionManagerAction } from "./team-actions";
import type { CatalogState } from "./catalog-actions";

const style = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
function Feedback({ state }: { state: CatalogState }) { return <>{state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.success && <p role="status" className="text-sm">{state.success}</p>}</>; }

export function TeamInviteForm({ solutionId }: { solutionId: string }) {
  const [state, action, pending] = useActionState(inviteSolutionManagerAction, undefined);
  return <ActionForm action={action} className="space-y-3"><input type="hidden" name="solutionId" value={solutionId} /><label className="block text-sm">Nom d’utilisateur du membre<input name="username" required minLength={3} maxLength={30} className={style} /></label><label className="block text-sm">Accès proposé<select name="kind" className={style}><option value="COLLABORATE">Ajouter un co-gestionnaire</option><option value="TRANSFER">Transférer mon accès et quitter la gestion</option></select></label><p className="text-sm text-muted-foreground">Le destinataire doit accepter sous sept jours. Un transfert ne retire votre accès qu’après son acceptation.</p><Feedback state={state} /><Button disabled={pending || Boolean(state?.success)}>Envoyer l’invitation</Button></ActionForm>;
}

export function TeamResponseForm({ id, cancel = false }: { id: string; cancel?: boolean }) {
  const [state, action, pending] = useActionState(respondSolutionInvitationAction, undefined);
  return <ActionForm action={action} className="space-y-3"><input type="hidden" name="id" value={id} />{cancel ? <input type="hidden" name="decision" value="CANCEL" /> : <label className="block text-sm">Votre réponse<select name="decision" className={style}><option value="DECLINE">Refuser</option><option value="ACCEPT">Accepter la gestion</option></select></label>}<Feedback state={state} /><Button disabled={pending || Boolean(state?.success)}>{cancel ? "Annuler l’invitation" : "Confirmer ma réponse"}</Button></ActionForm>;
}

export function TeamRemoveForm({ solutionId, userId, self }: { solutionId: string; userId: string; self: boolean }) {
  const [state, action, pending] = useActionState(removeSolutionManagerAction, undefined);
  return <ActionForm action={action} className="space-y-3"><input type="hidden" name="solutionId" value={solutionId} /><input type="hidden" name="userId" value={userId} /><label className="block text-sm">Motif<textarea name="note" minLength={20} maxLength={2000} required className={style} /></label><label className="flex items-center gap-2 text-sm"><input name="confirmed" type="checkbox" required />{self ? "Je confirme quitter la gestion de cette fiche." : "Je confirme retirer cet accès de gestion."}</label><Feedback state={state} /><Button variant="outline" disabled={pending || Boolean(state?.success)}>{self ? "Quitter la gestion" : "Retirer cet accès"}</Button></ActionForm>;
}
