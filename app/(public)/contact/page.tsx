import { Code2, ExternalLink, Mail, MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  COMMUNITY_EMAIL,
  DISCORD_INVITE_URL,
  GITHUB_URL,
  WHATSAPP_INVITE_URL,
} from "@/lib/community-links";

export const metadata = { title: "Contact & communauté" };

const channels = [
  {
    title: "Discord AfroCodeurs",
    description: "Lives, cours, ateliers et échanges rapides avec les membres.",
    href: DISCORD_INVITE_URL,
    label: "Rejoindre Discord",
    icon: MessageCircle,
  },
  {
    title: "Groupe WhatsApp",
    description: "Annonces communautaires et discussions depuis votre téléphone.",
    href: WHATSAPP_INVITE_URL,
    label: "Rejoindre WhatsApp",
    icon: MessageCircle,
  },
  {
    title: "Projet open source",
    description: "Proposer une amélioration ou contribuer directement au code.",
    href: GITHUB_URL,
    label: "Voir GitHub",
    icon: Code2,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-bold">Contact & communauté</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Choisissez le canal adapté : Discord pour les activités en direct,
        WhatsApp pour rester informé et GitHub pour construire la plateforme.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <article key={channel.title} className="flex flex-col rounded-2xl border border-border p-6">
              <Icon className="size-7 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{channel.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{channel.description}</p>
              <a href={channel.href} target="_blank" rel="noreferrer" className={`${buttonVariants({ variant: "outline" })} mt-5`}>
                {channel.label} <ExternalLink />
              </a>
            </article>
          );
        })}
      </div>

      <section className="mt-8 rounded-2xl bg-muted/50 p-6">
        <Mail className="size-6 text-primary" />
        <h2 className="mt-3 text-lg font-semibold">Écrire à l’équipe</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pour une question confidentielle, un partenariat ou un problème de compte.
        </p>
        <a href={`mailto:${COMMUNITY_EMAIL}`} className="mt-4 inline-block font-medium underline">
          {COMMUNITY_EMAIL}
        </a>
      </section>
    </div>
  );
}
