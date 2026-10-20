import Link from "next/link";
import { Search, Plus, X, ArrowLeft, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { VentureCloud } from "@/features/constellation/cloud";
import { ventureBlockedIds } from "@/features/constellation/queries";
import { COUNTRIES, SECTORS, type Sector } from "@/features/constellation/constants";

export const metadata = { title: "Constellation — Les réalisations de la communauté" };
export default async function ConstellationPage({ searchParams }: { searchParams: Promise<{ q?: string; country?: string; sector?: string; page?: string }> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const country = COUNTRIES.some((c) => c.code === params.country) ? params.country! : "";
  const sector = typeof params.sector === "string" && Object.hasOwn(SECTORS, params.sector) ? params.sector as Sector : "";
  const page = Math.min(1000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const session = await auth();
  const blocked = await ventureBlockedIds(session?.user?.id);
  const where = { status: "PUBLISHED" as const, ownerId: { notIn: blocked }, ...(country ? { country } : {}), ...(sector ? { sector } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { summary: { contains: q, mode: "insensitive" as const } }, { needs: { has: q.toLowerCase() } }] } : {}),
  };
  const [ventures, total] = await Promise.all([
    db.communityVenture.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 18, take: 18, select: { id: true, slug: true, name: true, summary: true, country: true, sector: true, logoUrl: true, needs: true } }),
    db.communityVenture.count({ where }),
  ]);
  const linkToPage = (p: number) => `/constellation?${new URLSearchParams({ q, country, sector, page: String(p) })}`;
  const field = "min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm";
  return <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6"><div><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Les réalisations de la communauté</p><h1 className="text-3xl font-bold sm:text-4xl">Constellation</h1><p className="mt-3 max-w-xl text-sm text-muted-foreground">Des produits en ligne, des savoir-faire et des liens à construire.</p></div><Link href="/constellation/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="size-4" />Présenter ma réalisation</Link></header>
    <form className="mt-6 grid items-center gap-3 sm:grid-cols-[minmax(160px,1fr)_minmax(120px,180px)_minmax(120px,180px)_auto]">
      <label className="relative"><span className="sr-only">Rechercher une réalisation</span><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input name="q" maxLength={80} defaultValue={q} className={`${field} w-full pl-9`} placeholder="Nom, activité, compétence…" /></label>
      <label><span className="sr-only">Filtrer par pays</span><select name="country" defaultValue={country} className={`${field} w-full`}><option value="">Tous les pays</option>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
      <label><span className="sr-only">Filtrer par secteur</span><select name="sector" defaultValue={sector} className={`${field} w-full`}><option value="">Tous les secteurs</option>{Object.entries(SECTORS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}</select></label>
      <button type="submit" className="rounded-md border border-border p-2" title="Appliquer les filtres" aria-label="Appliquer les filtres"><Search className="mx-auto size-5" /></button>
    </form>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>{total} réalisation(s) trouvée(s)</span>{(q || country || sector) && <Link href="/constellation" className="inline-flex items-center gap-1 underline"><X className="size-3" />Effacer les filtres</Link>}<Link href="/dashboard/constellation" className="underline">Mes réalisations et collaborations</Link></div>
    {ventures.length ? <VentureCloud ventures={ventures} /> : <section className="py-24 text-center"><h2 className="text-xl font-semibold">{q || country || sector ? "Aucune réalisation pour ces critères" : "La première place est peut-être la tienne"}</h2><p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{q || country || sector ? "Essaie un autre pays, secteur ou terme de recherche." : "Tu as lancé un produit ou un service ? Présente-le à la communauté."}</p><Link href="/constellation/new" className="mt-5 inline-block text-sm font-medium underline">Présenter ma réalisation</Link></section>}
    <nav aria-label="Pages de la Constellation" className="mt-5 flex items-center justify-between text-sm">{page > 1 ? <Link href={linkToPage(page - 1)} className="flex items-center gap-2"><ArrowLeft className="size-4" />Précédente</Link> : <span />}{page * 18 < total && <Link href={linkToPage(page + 1)} className="flex items-center gap-2">Suivante<ArrowRight className="size-4" /></Link>}</nav>
    <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">{Object.entries(SECTORS).map(([id, s]) => <span key={id} className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />{s.label}</span>)}</div>
  </div>;
}
