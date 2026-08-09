"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { createChallengeAction } from "./actions";
import { CHALLENGE_DIFFICULTY_LABELS } from "./constants";

const field = "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function ChallengeForm() {
  const [state, action, pending] = useActionState(createChallengeAction, undefined);
  const [mode, setMode] = useState("CLASSIC");
  return <form action={action} className="flex flex-col gap-5">
    <label className="flex flex-col gap-1 text-sm font-medium">Titre<input name="title" required minLength={5} maxLength={140} className={field} /></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Mise en situation (optionnelle)<textarea name="story" rows={3} maxLength={1000} className={field} placeholder="Plantez le décor sans révéler la réponse." /></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Consigne<textarea name="instructions" required minLength={20} rows={7} className={field} /></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Difficulté<select name="difficulty" defaultValue="INITIATE" className={field}>{Object.entries(CHALLENGE_DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Expérience<select name="mode" value={mode} onChange={(event) => setMode(event.target.value)} className={field}><option value="CLASSIC">Énigme classique</option><option value="PIXEL_TERMINAL">Aventure pixel art + terminal CTF</option></select>{mode === "PIXEL_TERMINAL" && <span className="text-xs font-normal text-muted-foreground">Le joueur devra explorer le baobab, récupérer une clé, alimenter l’ordinateur puis utiliser un terminal simulé.</span>}</label>
    <label className="flex flex-col gap-1 text-sm font-medium">{mode === "PIXEL_TERMINAL" ? "Flag final" : "Réponse attendue"}<input name="answer" required maxLength={200} className={field} autoComplete="off" placeholder={mode === "PIXEL_TERMINAL" ? "AFRO{votre_flag}" : undefined} /><span className="text-xs font-normal text-muted-foreground">{mode === "PIXEL_TERMINAL" ? "Le flag ne sera révélé qu’après la dernière manipulation validée par le serveur." : "Elle sera hashée et ne sera jamais envoyée au navigateur."}</span></label>
    <label className="flex flex-col gap-1 text-sm font-medium">Explication complète de la solution<textarea name="solutionExplanation" required minLength={20} rows={5} className={field} /></label>
    <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4"><legend className="px-1 font-semibold">Indices progressifs</legend>{[1,2,3].map((n) => <label key={n} className="flex flex-col gap-1 text-sm font-medium">Indice {n} (optionnel)<textarea name={`hint${n}`} rows={2} maxLength={500} className={field} /></label>)}</fieldset>
    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    <div className="flex gap-3"><Button name="intent" value="draft" variant="outline" disabled={pending}>Enregistrer le brouillon</Button><Button name="intent" value="submit" disabled={pending}>Soumettre à la modération</Button></div>
  </form>;
}
