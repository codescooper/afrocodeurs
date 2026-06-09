import Link from "next/link";
import { Search } from "lucide-react";

import { globalSearch, type SearchHit } from "@/features/search/search";

export const metadata = { title: "Recherche" };

const GROUPS: { key: keyof Omit<Awaited<ReturnType<typeof globalSearch>>, "total">; label: string }[] =
  [
    { key: "problems", label: "Problèmes" },
    { key: "knowledge", label: "Ressources" },
    { key: "questions", label: "Forum" },
    { key: "communities", label: "Communautés" },
    { key: "solutions", label: "Atlas" },
    { key: "users", label: "Membres" },
  ];

function HitRow({ hit }: { hit: SearchHit }) {
  const inner = (
    <span className="flex flex-col">
      <span className="font-medium">{hit.title}</span>
      {hit.subtitle && (
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {hit.subtitle}
        </span>
      )}
    </span>
  );
  return hit.href ? (
    <Link
      href={hit.href}
      className="block rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted/40"
    >
      {inner}
    </Link>
  ) : (
    <div className="rounded-md border border-border px-4 py-2">{inner}</div>
  );
}

/** Recherche globale (Sprint 7). */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await globalSearch(query) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Recherche</h1>

      <form
        action="/search"
        className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-sm"
      >
        <Search className="ml-2 size-5 text-muted-foreground" />
        <input
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Rechercher un problème, une ressource, une communauté…"
          className="flex-1 bg-transparent py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Rechercher
        </button>
      </form>

      {results && (
        <p className="mt-4 text-sm text-muted-foreground">
          {results.total} résultat{results.total > 1 ? "s" : ""} pour «&nbsp;
          {query}&nbsp;».
        </p>
      )}

      {results && results.total === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun résultat. Essayez d&apos;autres mots-clés.
        </div>
      )}

      {results && results.total > 0 && (
        <div className="mt-8 flex flex-col gap-8">
          {GROUPS.map(({ key, label }) => {
            const hits = results[key];
            if (hits.length === 0) return null;
            return (
              <section key={key}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {label} ({hits.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {hits.map((hit, i) => (
                    <HitRow key={`${key}-${i}`} hit={hit} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
