"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ImageUploadButton } from "@/features/media/image-upload";
import { Button } from "@/components/ui/button";
import { COUNTRIES, SECTORS } from "./constants";
import { saveVentureAction } from "./actions";
type Defaults = { id: string; name: string; summary: string; description: string; country: string; sector: string; websiteUrl: string; logoUrl: string | null; screenshots: string[]; needs: string[]; openSourceProjectId: string | null };
const input = "rounded-md border border-border bg-background px-3 py-2 text-sm";
export function VentureForm({ venture, projects }: { venture?: Defaults; projects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveVentureAction, undefined);
  const [logo, setLogo] = useState(venture?.logoUrl ?? "");
  const [shots, setShots] = useState(venture?.screenshots ?? []);
  return <form action={action} className="grid gap-5">
    {venture && <input type="hidden" name="id" value={venture.id} />}
    <label className="grid gap-1 text-sm">Nom de la réalisation<input className={input} name="name" required minLength={3} maxLength={100} defaultValue={venture?.name} /></label>
    <label className="grid gap-1 text-sm">En une phrase<textarea className={input} name="summary" rows={2} required minLength={20} maxLength={180} defaultValue={venture?.summary} /></label>
    <label className="grid gap-1 text-sm">Le produit, son public et le problème résolu<textarea className={input} name="description" rows={6} required minLength={80} maxLength={6000} defaultValue={venture?.description} /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Pays de lancement<select className={input} name="country" required defaultValue={venture?.country ?? ""}><option value="">Choisir un pays</option>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label><label className="grid gap-1 text-sm">Secteur<select className={input} name="sector" required defaultValue={venture?.sector ?? ""}><option value="">Choisir un secteur</option>{Object.entries(SECTORS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label></div>
    <label className="grid gap-1 text-sm">Lien HTTPS du service déjà déployé<input className={input} name="websiteUrl" type="url" required maxLength={500} placeholder="https://" defaultValue={venture?.websiteUrl} /></label>
    <fieldset className="space-y-3 border-y border-border py-4"><legend className="text-sm font-medium">Logo et captures</legend>
      <input type="hidden" name="logoUrl" value={logo} /><input type="hidden" name="screenshots" value={shots.join("\n")} />
      <div className="flex flex-wrap items-center gap-4"><ImageUploadButton label={logo ? "Remplacer le logo" : "Téléverser le logo"} onUploaded={(url) => setLogo(url)} />{logo && <><span className="size-12 rounded-full border border-border bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(logo)})` }} role="img" aria-label="Logo téléversé" /><button type="button" title="Retirer le logo" aria-label="Retirer le logo" onClick={() => setLogo("")}><X className="size-4" /></button></>}</div>
      {shots.length < 3 && <ImageUploadButton label="Ajouter une capture (3 maximum)" onUploaded={(url) => setShots((current) => [...new Set([...current, url])].slice(0, 3))} />}
      <div className="flex flex-wrap gap-3">{shots.map((shot, index) => <div key={shot} className="relative h-20 w-32 rounded-md border border-border bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(shot)})` }} role="img" aria-label={`Capture ${index + 1}`}><button type="button" title="Retirer cette capture" aria-label={`Retirer la capture ${index + 1}`} className="absolute right-0 top-0 bg-background p-1" onClick={() => setShots((current) => current.filter((s) => s !== shot))}><X className="size-4" /></button></div>)}</div>
    </fieldset>
    <label className="grid gap-1 text-sm">Collaborations recherchées (séparées par des virgules)<input className={input} name="needs" maxLength={300} placeholder="design, développement, tests, partenariats" defaultValue={venture?.needs.join(", ")} /></label>
    <label className="grid gap-1 text-sm">Mon projet open source associé (facultatif)<select name="openSourceProjectId" className={input} defaultValue={venture?.openSourceProjectId ?? ""}><option value="">Aucun dépôt associé</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label className="flex items-start gap-2 text-sm"><input className="mt-1" name="confirmed" type="checkbox" required />Je représente cette réalisation et dispose des droits nécessaires pour publier sa présentation et ses images.</label>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state?.success && <p role="status" className="text-sm">{state.success} <Link className="underline" href="/dashboard/constellation">Mes réalisations</Link></p>}
    <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Envoi…" : "Envoyer en validation"}</Button>
  </form>;
}
