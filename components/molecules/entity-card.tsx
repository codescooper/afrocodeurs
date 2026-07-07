import Link from "next/link";
import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge, badgeVariants } from "@/components/ui/badge";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

interface EntityCardProps {
  /** Si présent, toute la carte devient un lien (liste cliquable). */
  href?: string;
  /** Icône représentative (ex : secteur du problème) — texture visuelle, pas de sens sémantique seul. */
  icon?: LucideIcon;
  eyebrow?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  title: ReactNode;
  description?: ReactNode;
  /** Ligne basse (impact/difficulté, nombre de membres…). */
  meta?: ReactNode;
  className?: string;
}

/** Carte de liste générique (problème, ressource, communauté, solution…). */
export function EntityCard({
  href,
  icon: Icon,
  eyebrow,
  badge,
  badgeVariant = "secondary",
  title,
  description,
  meta,
  className,
}: EntityCardProps) {
  const content = (
    <>
      {(eyebrow || badge || Icon) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            )}
            {eyebrow && (
              <span className="truncate text-xs font-medium uppercase tracking-wide text-primary">
                {eyebrow}
              </span>
            )}
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="shrink-0">
              {badge}
            </Badge>
          )}
        </div>
      )}
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
      )}
      {meta && (
        <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {meta}
        </span>
      )}
    </>
  );

  const classes = cn(
    "flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors",
    href && "hover:bg-muted/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}
