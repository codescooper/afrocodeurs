"use client";
import { Check, Clipboard, Printer } from "lucide-react";
import { useState } from "react";
export function BrandActions() {
 const [copied,setCopied]=useState(false);
 async function copy(){await navigator.clipboard.writeText("#F5B800 · #111111 · #22C55E · #FAFAF8");setCopied(true);setTimeout(()=>setCopied(false),1600)}
 return <div className="brand-actions flex flex-wrap gap-2">
  <button onClick={()=>window.print()} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#F5B800] px-4 text-sm font-bold text-[#111111]"><Printer className="size-4"/>Exporter / imprimer</button>
  <button onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-md border border-current/20 px-4 text-sm font-semibold">{copied?<Check className="size-4"/>:<Clipboard className="size-4"/>}{copied?"Copié":"Copier la palette"}</button>
 </div>
}