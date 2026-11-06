"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ConstructionGate } from "./construction-gate";

export function CommunityEntry({ overlay = false }: { overlay?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  async function visit() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/entry/visitor", { method: "POST", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Visitor preference unavailable");
      if (overlay) { setOpen(false); router.refresh(); }
      else router.replace("/");
    } catch { setError("Le choix n’a pas pu être enregistré. Réessaie ou explore directement les projets."); }
    finally { busy.current = false; setPending(false); }
  }
  const experience = <ConstructionGate onVisit={() => void visit()} visiting={pending} visitError={error} />;
  if (!overlay) return experience;
  return <Dialog open={open} onOpenChange={(next) => { if (!next) void visit(); }}>
    <DialogContent showCloseButton={false} aria-describedby={undefined}
      onCloseAutoFocus={(event) => { event.preventDefault(); document.getElementById("community-home-title")?.focus(); }}
      className="top-0 left-0 z-[80] h-dvh w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-0 bg-[#080b0f] p-0 shadow-none sm:max-w-none">
      <DialogTitle className="sr-only">Bienvenue dans la communauté AfroCodeurs</DialogTitle>
      {experience}
    </DialogContent>
  </Dialog>;
}
