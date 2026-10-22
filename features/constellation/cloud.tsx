"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CircleDot, List, Pause, Play } from "lucide-react";
import { SECTORS, type Sector, countryName } from "./constants";
import { VentureMark } from "./venture-mark";
import { constellationHeight, constellationLayout } from "./layout";

export type VentureBubble = { id: string; slug: string; name: string; summary: string; country: string; sector: string; logoUrl: string | null; needs: string[] };
export function VentureCloud({ ventures }: { ventures: VentureBubble[] }) {
  const [view, setView] = useState<"cloud" | "list">("cloud");
  const [paused, setPaused] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 640 });
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  const height = constellationHeight(ventures.length, size.width || 360);
  const positions = useMemo(() => size.width ? constellationLayout(ventures.map((v) => v.id), size.width, height) : [], [ventures, size.width, height]);
  return <section aria-label="Réalisations de la communauté">
    <div className="flex flex-wrap items-center justify-between gap-3 py-4"><p className="text-sm text-muted-foreground">{ventures.length} réalisation(s) sur cette page</p>
      <div className="flex items-center gap-1" role="group" aria-label="Affichage"><button type="button" title="Nuée de projets" aria-label="Nuée de projets" aria-pressed={view === "cloud"} onClick={() => setView("cloud")} className={`rounded-md p-2 ${view === "cloud" ? "bg-muted" : ""}`}><CircleDot className="size-5" /></button><button type="button" title="Vue liste" aria-label="Vue liste" aria-pressed={view === "list"} onClick={() => setView("list")} className={`rounded-md p-2 ${view === "list" ? "bg-muted" : ""}`}><List className="size-5" /></button>{view === "cloud" && <button type="button" title={paused ? "Reprendre les mouvements" : "Suspendre les mouvements"} aria-label={paused ? "Reprendre les mouvements" : "Suspendre les mouvements"} onClick={() => setPaused((p) => !p)} className="rounded-md p-2">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>}</div>
    </div>
    <div ref={container} style={{ height: view === "cloud" ? height : 0 }} className="relative w-full overflow-hidden bg-[#0c1210]">
      <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#b6c9bc 1px, transparent 1px),linear-gradient(90deg,#b6c9bc 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
      {positions.map((position, index) => {
        const venture = ventures[index];
        const sector = SECTORS[venture.sector as Sector] ?? SECTORS.OTHER;
        return <Link key={venture.id} href={`/constellation/${venture.slug}`} scroll={false} prefetch={false} data-venture-link={venture.slug} aria-label={`${venture.name} — ${countryName(venture.country)} — ${sector.label}`} className="absolute z-10 flex w-24 flex-col items-center gap-2 text-center text-white focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" style={{ left: position.x, top: position.y, transform: "translate(-50%, -50%)" }}>
          <span className={`rounded-full p-1 ring-1 transition-shadow hover:ring-4 ${paused ? "" : "venture-float"}`} style={{ color: sector.color, boxShadow: `0 0 0 1px ${sector.color}`, animationDelay: `${index % 5 * -0.8}s` }}><VentureMark {...venture} /></span>
          <span className="line-clamp-2 min-h-8 max-w-full break-words text-xs font-medium leading-4">{venture.name}</span>
        </Link>;
      })}
      {!size.width && <p className="absolute inset-0 grid place-items-center text-sm text-white/60" role="status">Chargement des réalisations…</p>}
    </div>
    {view === "list" && <ul className="divide-y divide-border">{ventures.map((v) => <li key={v.id}><Link href={`/constellation/${v.slug}`} scroll={false} prefetch={false} className="flex gap-4 py-5"><VentureMark {...v} /><div className="min-w-0"><h2 className="break-words font-semibold">{v.name}</h2><p className="text-xs text-muted-foreground">{countryName(v.country)} · {(SECTORS[v.sector as Sector] ?? SECTORS.OTHER).label}</p><p className="mt-2 text-sm">{v.summary}</p></div></Link></li>)}</ul>}
    <noscript><ul>{ventures.map((v) => <li key={v.id}><a href={`/constellation/${v.slug}`}>{v.name}</a></li>)}</ul></noscript>
    <style>{`@keyframes ventureFloat { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-3px) } } .venture-float { animation:ventureFloat 6s ease-in-out infinite } @media(prefers-reduced-motion:reduce) { .venture-float { animation:none } }`}</style>
  </section>;
}
