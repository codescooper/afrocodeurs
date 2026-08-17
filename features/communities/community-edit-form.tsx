"use client";

import { useActionState } from "react";
import type { CommunityType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { COMMUNITY_TYPE_LABELS } from "@/features/communities/constants";
import {
  deleteCommunityAction,
  manageCommunityMemberAction,
  updateCommunityAction,
} from "@/features/communities/actions";

const field = "rounded-md border border-border bg-background px-3 py-2";

export function CommunityEditForm({
  community,
}: {
  community: {
    id: string;
    name: string;
    description: string | null;
    type: CommunityType;
    country: string | null;
    city: string | null;
    slug: string;
    members: Array<{ id: string; role: string; chatMutedUntil: Date | null; user: { username: string; name: string | null } }>;
  };
}) {
  const [state, action, pending] = useActionState(updateCommunityAction, undefined);

  return (
    <div className="space-y-10">
      <form action={action} className="grid gap-4 rounded-xl border border-border p-5">
        <input type="hidden" name="id" value={community.id} />
        <label className="grid gap-1 text-sm font-medium">Nom<input name="name" required minLength={3} maxLength={80} defaultValue={community.name} className={field} /></label>
        <label className="grid gap-1 text-sm font-medium">Description<textarea name="description" maxLength={500} rows={6} defaultValue={community.description ?? ""} className={field} /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium">Type<select name="type" defaultValue={community.type} className={field}>{Object.entries(COMMUNITY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-medium">Pays<input name="country" maxLength={80} defaultValue={community.country ?? ""} className={field} /></label>
          <label className="grid gap-1 text-sm font-medium">Ville<input name="city" maxLength={80} defaultValue={community.city ?? ""} className={field} /></label>
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-fit">{pending ? "Enregistrement…" : "Enregistrer les modifications"}</Button>
      </form>

      <section className="rounded-xl border border-border p-5">
        <h2 className="font-semibold">Gérer les membres</h2>
        <p className="mt-1 text-sm text-muted-foreground">Attribuez un rôle, suspendez le salon pendant 24 h ou retirez un membre.</p>
        <ul className="mt-4 divide-y divide-border">{community.members.map((member) => <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><strong className="text-sm">{member.user.name ?? `@${member.user.username}`}</strong><p className="text-xs text-muted-foreground">{member.role}{member.chatMutedUntil && member.chatMutedUntil > new Date() ? " · salon suspendu" : ""}</p></div><form action={manageCommunityMemberAction} className="flex flex-wrap gap-2"><input type="hidden" name="communityId" value={community.id}/><input type="hidden" name="memberId" value={member.id}/><input type="hidden" name="slug" value={community.slug}/><select name="decision" defaultValue="" className={field} required><option value="" disabled>Action…</option><option value="admin">Administrateur</option><option value="moderator">Modérateur</option><option value="member">Membre</option><option value="mute">Suspendre 24 h</option><option value="unmute">Lever la suspension</option><option value="remove">Retirer</option></select><Button type="submit" size="sm" variant="outline">Appliquer</Button></form></li>)}</ul>
      </section>

      <section className="rounded-xl border border-destructive/40 p-5">
        <h2 className="font-semibold text-destructive">Supprimer la communauté</h2>
        <p className="mt-2 text-sm text-muted-foreground">Cette action retire la communauté et ses adhésions. Les projets associés sont conservés.</p>
        <form action={deleteCommunityAction} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={community.id} />
          <label className="grid gap-1 text-sm font-medium">Écrivez SUPPRIMER<input name="confirmation" required pattern="SUPPRIMER" className={field} /></label>
          <Button type="submit" variant="destructive">Supprimer définitivement</Button>
        </form>
      </section>
    </div>
  );
}
