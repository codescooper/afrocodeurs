import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/shared/avatar";
import { UpvoteBadge } from "@/components/atoms/upvote-badge";

/** Carte "produit/solution" façon Product Hunt : icône, nom, description, score à droite. */
export function ProductCard({
  href,
  name,
  eyebrow,
  description,
  score,
  meta,
}: {
  href: string;
  name: string;
  eyebrow?: string;
  description?: string;
  score: number;
  meta?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/40"
    >
      <Avatar name={name} size={40} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {eyebrow && (
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
        )}
        <h3 className="font-semibold">{name}</h3>
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {meta && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {meta}
          </span>
        )}
      </div>
      <UpvoteBadge score={score} />
    </Link>
  );
}
