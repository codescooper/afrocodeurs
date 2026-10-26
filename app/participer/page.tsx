import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { GITHUB_URL, COMMUNITY_EMAIL } from "@/lib/community-links";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("/participer", "Participer à la communauté AfroCodeurs", "Présenter un projet africain, contribuer à l’open source, trouver de l’entraide ou transmettre : choisissez votre première contribution à AfroCodeurs.");

const paths = [
  { title: "J’ai un projet déjà en ligne", description: "Présentez votre produit dans la Constellation, découvrez les autres réalisations et proposez une collaboration. Votre projet peut être open source ou non.", href: "/constellation", action: "Découvrir la Constellation" },
  { title: "Je veux contribuer à un projet ouvert", description: "Explorez les roadmaps des projets open source. Choisissez une tâche adaptée à vos compétences : code, documentation, design ou tests.", href: "/projects", action: "Explorer les projets open source" },
  { title: "J’apprends ou je rencontre un blocage", description: "Cherchez une réponse dans les ressources et le forum. Une question précise, avec ce que vous avez déjà essayé, aide les membres à vous accompagner.", href: "/forum", action: "Rencontrer le forum" },
  { title: "Je veux transmettre", description: "Découvrez le mentorat ou partagez une ressource tirée de votre expérience. Pas besoin d’être expert en tout pour aider quelqu’un à avancer.", href: "/mentorship", action: "Découvrir le mentorat" },
  { title: "Je cherche des personnes avec qui avancer", description: "Rencontrez les communautés locales et thématiques, sur le continent et dans la diaspora. Commencez par vous présenter et échanger autour d’un besoin concret.", href: "/communities", action: "Trouver une communauté" },
];

export default function ParticipatePage() {
  return <>
    <header className="border-b border-border px-6 py-4"><nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4" aria-label="Navigation"><Link href="/" className="flex items-center gap-3 font-semibold"><Image src="/icon.svg" alt="" width={36} height={36} />AfroCodeurs</Link><Link href="/a-propos" className="text-sm underline">À propos</Link></nav></header>
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold">Votre place dans AfroCodeurs</h1>
      <p className="mt-4 max-w-3xl text-lg">Une idée, une question ou une compétence : commencez par ce que vous avez aujourd’hui. Débutants et profils expérimentés, en Afrique et dans la diaspora, peuvent faire avancer la communauté.</p>
      <div className="mt-10 divide-y divide-border">{paths.map(path => <section key={path.href} className="py-7"><h2 className="text-xl font-semibold">{path.title}</h2><p className="mt-3 max-w-3xl leading-relaxed">{path.description}</p><Link href={path.href} className="mt-4 inline-flex items-center gap-2 font-medium underline">{path.action}<ArrowRight className="size-4" aria-hidden="true" /></Link></section>)}</div>
      <section className="mt-6 border-t border-border pt-8"><h2 className="text-xl font-semibold">Faire vivre la plateforme elle-même</h2><p className="mt-3 max-w-3xl leading-relaxed">AfroCodeurs est un projet communautaire open source. Signalez un problème, améliorez une traduction, testez un parcours ou proposez un correctif.</p><a href={`${GITHUB_URL}/contribute`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block underline">Trouver une première contribution sur GitHub</a></section>
      <section className="mt-10 border-t border-border pt-8"><h2 className="text-xl font-semibold">Écoles, associations et communautés locales</h2><p className="mt-3 max-w-3xl leading-relaxed">Proposez un atelier, une rencontre ou une mise en lumière de projets avec vos membres. Parlons d’un besoin concret et de ce que nous pouvons construire ensemble.</p><a href={`mailto:${COMMUNITY_EMAIL}?subject=Collaboration%20avec%20AfroCodeurs`} className="mt-4 inline-block underline">Proposer une collaboration</a></section>
      <p className="mt-10"><Link href="/register" className="font-semibold underline">Créer mon compte</Link> · Les pages publiques restent consultables sans inscription.</p>
    </main>
    <SiteFooter />
  </>;
}
