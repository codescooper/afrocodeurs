"use client";

import { useActionState } from "react";
import { Backpack, KeyRound, Monitor, Sun, TerminalSquare, TreePine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { playChallengeAction, type EngineState } from "./engine-actions";
import { AnswerForm } from "./answer-form";

export function PixelTerminalGame({ challengeId, initial }: { challengeId: string; initial: EngineState }) {
  const [state, action, pending] = useActionState(playChallengeAction, initial);
  const terminalReady = state.step >= 4;

  return <section className="mt-8 overflow-hidden rounded-2xl border-4 border-slate-900 bg-slate-950 text-white shadow-2xl [image-rendering:pixelated]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-slate-900 bg-amber-400 px-4 py-3 text-slate-950">
      <div><p className="font-mono text-xs font-bold uppercase tracking-[.2em]">Mission interactive</p><h2 className="font-mono text-lg font-black">LE TERMINAL DU BAOBAB</h2></div>
      <div className="flex items-center gap-2 rounded bg-slate-950 px-3 py-2 font-mono text-xs text-amber-300"><Backpack className="size-4" />{state.inventory.length ? state.inventory.join(", ") : "inventaire vide"}</div>
    </header>

    <div className="relative min-h-[390px] overflow-hidden bg-[linear-gradient(#172554_0_58%,#713f12_58%_63%,#14532d_63%)] p-4 sm:min-h-[460px]">
      <div className="absolute left-[8%] top-[9%] size-20 rounded-full bg-amber-300 shadow-[0_0_40px_12px_rgba(253,224,71,.35)]"><Sun className="m-5 size-10 text-orange-600" /></div>
      <div className="absolute inset-x-0 top-[56%] h-3 bg-amber-700" />
      <div className="absolute bottom-6 left-[3%] sm:left-[8%]">
        <ActionObject challengeId={challengeId} action={action} event="inspect_baobab" label="Inspecter le baobab" disabled={pending} className="h-44 w-32 bg-amber-950 hover:-translate-y-1">
          <TreePine className="size-20 text-green-400 drop-shadow-[6px_6px_0_#052e16]" /><span className="absolute bottom-5 left-1/2 h-28 w-8 -translate-x-1/2 bg-amber-800 shadow-[8px_0_0_#451a03]" />
        </ActionObject>
      </div>
      <div className="absolute bottom-10 left-[39%] sm:left-[45%]">
        <ActionObject challengeId={challengeId} action={action} event="take_usb" label="Fouiller la caisse" disabled={pending} className="h-16 w-20 bg-amber-800 hover:rotate-2">
          <KeyRound className="size-8 text-cyan-300" /><span className="font-mono text-[9px]">CAISSE</span>
        </ActionObject>
      </div>
      <div className="absolute right-[5%] top-[30%] sm:right-[12%]">
        <ActionObject challengeId={challengeId} action={action} event="activate_solar" label="Activer le panneau solaire" disabled={pending} className="h-24 w-28 -skew-y-6 border-cyan-300 bg-blue-900 hover:translate-x-1">
          <Sun className="size-8 text-yellow-300" /><span className="font-mono text-[9px]">SOLAR-225</span>
        </ActionObject>
      </div>
      <div className="absolute bottom-8 right-[5%] sm:right-[15%]">
        <ActionObject challengeId={challengeId} action={action} event="boot_computer" label="Démarrer l’ordinateur" disabled={pending} className={`h-28 w-28 bg-slate-800 hover:-translate-y-1 ${terminalReady ? "shadow-[0_0_24px_#22c55e]" : ""}`}>
          <Monitor className={`size-14 ${terminalReady ? "text-green-400" : "text-slate-500"}`} /><span className="font-mono text-[9px]">AFRO-OS</span>
        </ActionObject>
      </div>
      <div className="absolute bottom-5 left-[24%] h-14 w-8 bg-orange-900 shadow-[8px_0_0_#111827,-4px_-14px_0_#111827]"><span className="absolute -left-2 -top-7 size-10 rounded-full bg-slate-950 shadow-[4px_0_0_#f59e0b]" /></div>
    </div>

    <div className="grid border-t-4 border-slate-900 lg:grid-cols-[1fr_1.25fr]">
      <div className="border-b-4 border-slate-900 bg-slate-900 p-4 lg:border-b-0 lg:border-r-4"><p className="font-mono text-xs uppercase text-amber-300">Journal de mission · étape {state.step}/8</p><p className="mt-2 min-h-12 font-mono text-sm text-slate-200" aria-live="polite">{state.message}</p><p className="mt-3 text-xs text-slate-400">Astuce : les objets utiles bougent légèrement au survol ou au toucher.</p></div>
      <div className={`bg-black p-4 ${terminalReady ? "" : "opacity-50"}`}><div className="flex items-center gap-2 font-mono text-xs text-green-400"><TerminalSquare className="size-4" /> afro-terminal://atelier</div><div className="mt-3 h-32 overflow-y-auto rounded border border-green-900 bg-[#020b06] p-3 font-mono text-xs text-green-300">{state.terminal.length ? state.terminal.map((line, index) => <div key={`${line}-${index}`}>{line}</div>) : <div>{terminalReady ? "Terminal prêt. Tapez help." : "[HORS LIGNE] Rétablissez l’énergie."}</div>}</div><form action={action} className="mt-3 flex gap-2"><input type="hidden" name="challengeId" value={challengeId} /><input type="hidden" name="event" value="terminal" /><span className="pt-2 font-mono text-green-400">$</span><input name="command" disabled={!terminalReady || pending} autoComplete="off" className="h-9 min-w-0 flex-1 border-b-2 border-green-800 bg-transparent px-2 font-mono text-sm text-green-300 outline-none focus:border-green-400" placeholder="help" /><Button type="submit" size="sm" disabled={!terminalReady || pending}>Exécuter</Button></form>{state.completionCode && <div className="mt-4 animate-pulse rounded border-2 border-amber-300 bg-amber-300/10 p-3 text-center font-mono font-bold text-amber-300">FLAG TROUVÉ : {state.completionCode}</div>}</div>
    </div>
    {state.step >= 8 && <div className="border-t-4 border-slate-900 bg-slate-100 p-5 text-slate-950"><p className="mb-3 font-mono text-sm font-bold">Dernière étape : validez le flag trouvé pour recevoir vos points.</p><AnswerForm id={challengeId} /></div>}
  </section>;
}

function ActionObject({ challengeId, action, event, label, disabled, className, children }: { challengeId: string; action: (payload: FormData) => void; event: string; label: string; disabled: boolean; className: string; children: React.ReactNode }) {
  return <form action={action}><input type="hidden" name="challengeId" value={challengeId} /><button type="submit" name="event" value={event} disabled={disabled} aria-label={label} title={label} className={`relative flex cursor-pointer flex-col items-center justify-center gap-1 border-4 border-slate-950 transition-transform duration-150 hover:animate-pulse focus-visible:animate-bounce focus-visible:outline-4 focus-visible:outline-amber-300 disabled:cursor-wait ${className}`}>{children}</button></form>;
}
