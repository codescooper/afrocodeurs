"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/lib/community-links";
import { createEventAction } from "./actions";
import {
  EVENT_FORMAT_LABELS,
  EVENT_FORMATS,
  EVENT_PLATFORMS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
} from "./constants";

const field =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function EventForm({
  communities,
  discordConfigured,
}: {
  communities: Array<{ id: string; name: string }>;
  discordConfigured: boolean;
}) {
  const [state, action, pending] = useActionState(
    createEventAction,
    undefined,
  );
  const [format, setFormat] =
    useState<(typeof EVENT_FORMATS)[number]>("ONLINE");
  const [platform, setPlatform] = useState("Discord");
  const [accessUrl, setAccessUrl] = useState(DISCORD_INVITE_URL);

  return (
    <form action={action} className="grid gap-5">
      <label className="grid gap-1 text-sm font-medium">
        Titre
        <input className={field} name="title" required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Type
          <select className={field} name="type">
            {EVENT_TYPES.map((item) => (
              <option key={item} value={item}>
                {EVENT_TYPE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Format
          <select
            className={field}
            name="format"
            value={format}
            onChange={(event) =>
              setFormat(event.target.value as typeof format)
            }
          >
            {EVENT_FORMATS.map((item) => (
              <option key={item} value={item}>
                {EVENT_FORMAT_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Résumé
        <textarea className={field} name="summary" rows={3} required />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Description
        <textarea className={field} name="description" rows={8} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Début
          <input className={field} name="startsAt" type="datetime-local" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Fin
          <input className={field} name="endsAt" type="datetime-local" required />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Fuseau horaire
          <input className={field} name="timezone" defaultValue="Africa/Abidjan" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Places disponibles
          <input className={field} name="capacity" type="number" min="1" placeholder="Illimité" />
        </label>
      </div>

      {format !== "IN_PERSON" && (
        <div className="grid gap-4 rounded-xl border border-border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Plateforme du direct
              <select
                className={field}
                name="platform"
                value={platform}
                onChange={(event) => {
                  const next = event.target.value;
                  setPlatform(next);
                  if (next === "Discord" && !accessUrl) setAccessUrl(DISCORD_INVITE_URL);
                }}
              >
                {EVENT_PLATFORMS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Lien privé du direct
              <input className={field} name="accessUrl" type="url" value={accessUrl} onChange={(event) => setAccessUrl(event.target.value)} required />
            </label>
          </div>

          {platform === "Discord" && (
            <label className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm">
              <input className="mt-1" name="syncToDiscord" type="checkbox" defaultChecked={discordConfigured} disabled={!discordConfigured} />
              <span>
                <strong>Créer aussi un événement planifié sur Discord</strong>
                <span className="mt-1 block text-muted-foreground">
                  {discordConfigured
                    ? "Les membres le verront dans Discord et pourront demander un rappel."
                    : "Le bot Discord doit d’abord être activé par un administrateur. L’événement AfroCodeurs sera tout de même publié avec le lien d’invitation."}
                </span>
              </span>
            </label>
          )}

          {platform === "BigBlueButton" && (
            <p className="text-sm text-muted-foreground">
              Collez le lien d’une salle BigBlueButton hébergée sur un serveur externe. AfroCodeurs ne surcharge ainsi pas son VPS principal.
            </p>
          )}
        </div>
      )}

      {format !== "ONLINE" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium">Lieu<input className={field} name="venue" required /></label>
          <label className="grid gap-1 text-sm font-medium">Ville<input className={field} name="city" /></label>
          <label className="grid gap-1 text-sm font-medium">Pays<input className={field} name="country" /></label>
        </div>
      )}

      <label className="grid gap-1 text-sm font-medium">
        Communauté associée
        <select className={field} name="communityId">
          <option value="">Aucune — événement général</option>
          {communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}
        </select>
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button disabled={pending} className="justify-self-start">{pending ? "Publication…" : "Publier l’événement"}</Button>
    </form>
  );
}
