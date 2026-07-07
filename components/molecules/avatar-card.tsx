import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/shared/avatar";

/** Carte "communauté/organisation" façon Discord (icône ronde + nom + membres). */
export function AvatarCard({
  href,
  avatarName,
  avatarImage,
  eyebrow,
  title,
  description,
  meta,
}: {
  href: string;
  avatarName: string;
  avatarImage?: string | null;
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-6 text-center transition-colors hover:bg-muted/40"
    >
      <Avatar image={avatarImage} name={avatarName} size={56} />
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {eyebrow}
          </span>
        )}
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {meta && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {meta}
        </span>
      )}
    </Link>
  );
}
