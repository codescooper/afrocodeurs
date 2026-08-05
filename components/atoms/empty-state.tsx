import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Bloc d'état vide pour une liste ("Aucun X pour le moment…"). */
export function EmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
