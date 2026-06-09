import Link from "next/link";
import { Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const SECTIONS = [
  { title: "Problèmes populaires", hint: "Quel problème puis-je résoudre ?" },
  { title: "Solutions récentes", hint: "Que puis-je construire ?" },
  { title: "Communautés actives", hint: "Qui peut m'aider ?" },
  { title: "AfroMakers à suivre", hint: "Qui peut m'aider ?" },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Des problèmes aux solutions,{" "}
          <span className="text-primary">ensemble.</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          La communauté panafricaine où les passionnés de technologie
          apprennent, collaborent et construisent des solutions adaptées aux
          réalités du continent.
        </p>

        <form
          action="/search"
          className="flex w-full max-w-xl items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-sm"
        >
          <Search className="ml-2 size-5 text-muted-foreground" />
          <input
            name="q"
            placeholder="Quel problème souhaitez-vous résoudre ?"
            className="flex-1 bg-transparent py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className={buttonVariants({ size: "sm" })}
          >
            Rechercher
          </button>
        </form>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/explorer" className={buttonVariants({ size: "lg" })}>
            Explorer les problèmes
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Rejoindre la communauté
          </Link>
        </div>
      </section>

      {/* Sections de découverte */}
      <div className="grid gap-6 pb-16 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className="rounded-lg border border-border bg-background p-6"
          >
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.hint}</p>
            <p className="mt-6 text-sm text-muted-foreground">
              Bientôt disponible — contenu alimenté par la communauté.
            </p>
          </section>
        ))}
      </div>

      {/* Statistiques */}
      <section className="mb-20 grid grid-cols-3 gap-4 rounded-lg border border-border bg-muted/40 p-6 text-center">
        {[
          ["Problèmes", "—"],
          ["Solutions", "—"],
          ["AfroMakers", "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-2xl font-bold text-primary">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
