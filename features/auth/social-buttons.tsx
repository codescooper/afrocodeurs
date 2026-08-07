import { connection } from "next/server";

import { Separator } from "@/components/ui/separator";

import { SocialSignInButton } from "./social-sign-in-button";

const PROVIDERS = [
  { id: "google", enabled: Boolean(process.env.GOOGLE_CLIENT_ID) },
  { id: "github", enabled: Boolean(process.env.GITHUB_CLIENT_ID) },
] as const;

/**
 * Boutons de connexion sociale (Google / GitHub), rendus uniquement si les
 * clés OAuth correspondantes sont configurées côté serveur — dégradation
 * propre quand aucun provider n'est actif.
 *
 * `connection()` sort la route du pré-rendu statique : les clés sont lues à
 * chaque requête (et non figées au build), pour que les boutons apparaissent
 * dès que les variables sont définies en production.
 */
export async function SocialButtons() {
  await connection();

  const enabled = PROVIDERS.filter((p) => p.enabled);
  if (enabled.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {enabled.map((p) => (
        <SocialSignInButton key={p.id} provider={p.id} />
      ))}
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <Separator className="flex-1" />
        ou
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
