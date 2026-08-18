import Link from "next/link";

import { cn } from "@/lib/utils";

/** Logo AfroCodeurs : badge + nom, lien vers l'accueil. `className` s'applique au nom. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold">
      <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
        A
      </span>
      <span className={cn(className)}>AfroCodeurs</span>
    </Link>
  );
}
