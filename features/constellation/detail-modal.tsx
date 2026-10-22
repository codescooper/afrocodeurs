"use client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
export function VentureDetailModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return <Dialog open onOpenChange={(open) => { if (!open) router.back(); }}>
    <DialogContent aria-describedby={undefined} className="max-h-[100dvh] max-w-full overflow-y-auto rounded-none p-0 sm:max-h-[90dvh] sm:max-w-3xl sm:rounded-lg">
      <DialogTitle className="sr-only">Fiche de la réalisation</DialogTitle>{children}
    </DialogContent>
  </Dialog>;
}
