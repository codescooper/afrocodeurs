import { heritageEntries, heritagePipeline } from "@/features/brand/heritage";

const badge:Record<string,string>={
  documented:"Documenté",review:"À étudier","community-review":"Validation communauté",
  citation:"Citation",documentation:"Documentation",restricted:"Usage restreint"
};

export function HeritageExplorer(){
 const systems=[...new Set(heritageEntries.map(x=>x.system))];
 return <div className="mt-8">
  <div className="flex flex-wrap gap-2">{systems.map(x=><span key={x} className="rounded-full border border-black/15 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase">{x}</span>)}</div>
  <div className="mt-6 grid gap-4 lg:grid-cols-2">{heritageEntries.map(x=><article key={x.id} className="rounded-xl border border-black/10 bg-white p-5">
   <div className="flex flex-wrap items-center justify-between gap-2"><code className="text-[10px] text-black/45">{x.id}</code><div className="flex gap-1"><span className="rounded-full bg-[#22C55E]/10 px-2 py-1 text-[10px] font-bold">{badge[x.validation]}</span><span className="rounded-full bg-black/5 px-2 py-1 text-[10px] font-bold">{badge[x.usage]}</span></div></div>
   <h3 className="mt-4 text-xl font-black">{x.name}</h3><p className="mt-1 text-xs font-bold uppercase tracking-wider text-black/45">{x.system} · {x.kind}</p>
   <dl className="mt-4 grid grid-cols-[84px_1fr] gap-x-3 gap-y-2 text-sm"><dt className="text-black/45">Culture</dt><dd>{x.people}</dd><dt className="text-black/45">Zone</dt><dd>{x.geography}</dd><dt className="text-black/45">Sens</dt><dd>{x.meaning}</dd></dl>
   {x.note&&<p className="mt-4 rounded-lg bg-[#F5B800]/10 p-3 text-xs leading-5"><b>Prudence culturelle.</b> {x.note}</p>}
   <a href={x.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-bold underline underline-offset-4">{x.sourceLabel} ↗</a>
  </article>)}</div>
  <div className="mt-8 rounded-xl bg-[#111111] p-6 text-white"><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#F5B800]">Catalogue vivant</p><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Une culture absente n’est pas considérée comme inexistante. African Heritage grandit avec les communautés AfroCodeurs, les sources et les validations.</p><div className="mt-5 flex flex-wrap gap-2">{heritagePipeline.map((x,i)=><span key={x} className="rounded-full border border-white/15 px-3 py-1 text-xs">{i+1}. {x}</span>)}</div></div>
 </div>
}
