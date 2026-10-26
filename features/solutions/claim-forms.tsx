"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { requestSolutionClaimAction, reviewSolutionClaimAction, verifySolutionLicenseAction, checkSolutionGithubProofAction, type CatalogState } from "./catalog-actions";

const style = "w-full rounded-md border border-border bg-background px-3 py-2";
function Feedback({ state }: { state: CatalogState }) { return <>{state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state?.success && <p role="status" className="text-sm">{state.success}</p>}</>; }

export function GithubProofForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(checkSolutionGithubProofAction, undefined);
  return <ActionForm action={action} className="mt-3 space-y-3"><input type="hidden" name="id" value={id} /><Feedback state={state} /><Button disabled={pending || Boolean(state?.success)}>Vérifier mon marqueur GitHub</Button></ActionForm>;
}

export function ClaimForm({ solutionId }: { solutionId: string }) {
  const [state, action, pending] = useActionState(requestSolutionClaimAction, undefined);
  return <ActionForm action={action} className="space-y-3"><input type="hidden" name="solutionId" value={solutionId} /><label className="block text-sm">Votre lien avec le projet et les preuves à vérifier<textarea name="evidence" required minLength={40} maxLength={3000} rows={4} className={style} /></label><p className="text-sm text-muted-foreground">Par exemple : un code temporaire placé dans le dépôt ou sur le site officiel, avec son emplacement. Ne communiquez jamais de mot de passe ni de clé privée. Ces éléments sont visibles uniquement de vous et des administrateurs.</p><Feedback state={state} /><Button disabled={pending || Boolean(state?.success)}>Demander la gestion de cette fiche</Button></ActionForm>;
}

export function ClaimReviewForm({ id, self, revision }: { id: string; self: boolean; revision: number }) {
  const [state, action, pending] = useActionState(reviewSolutionClaimAction, undefined);
  if (self) return <p>Un autre administrateur doit examiner votre propre demande.</p>;
  return <ActionForm action={action} className="space-y-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="revision" value={revision} /><label className="block text-sm">Décision<select name="status" className={style}><option value="REJECTED">Refuser</option><option value="APPROVED">Accorder la gestion</option></select></label><label className="block text-sm">Vérification effectuée et motif<textarea name="note" required minLength={20} maxLength={2000} className={style} /></label><label className="flex items-start gap-2 text-sm"><input name="confirmed" type="checkbox" />J’ai constaté le code personnel dans le dépôt ou le site officiel, ou documenté une preuve indépendante équivalente de contrôle du projet.</label><Feedback state={state} /><Button disabled={pending || Boolean(state?.success)}>Enregistrer la décision</Button></ActionForm>;
}

export function LicenseReviewForm({ id, revision }: { id: string; revision: number }) {
  const [state, action, pending] = useActionState(verifySolutionLicenseAction, undefined);
  return <ActionForm action={action} className="space-y-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="revision" value={revision} /><label className="block text-sm">Licence open source<select name="verified" className={style}><option value="no">Non vérifiée ou incompatible</option><option value="yes">Vérifiée dans le dépôt source</option></select></label><label className="block text-sm">Source de la licence et motif<textarea name="note" minLength={20} maxLength={2000} required className={style} /></label><Feedback state={state} /><Button disabled={pending || Boolean(state?.success)}>Enregistrer la vérification</Button></ActionForm>;
}
