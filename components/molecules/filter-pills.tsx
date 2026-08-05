import Link from "next/link";

import { cn } from "@/lib/utils";

export type FilterOption = { label: string; value: string; count: number };

/** Rangée de filtres façon "labels" GitHub Issues / catégories Kickstarter — navigation par query string, sans JS. */
export function FilterPills({
  options,
  active,
  baseHref,
  paramName,
  allLabel = "Tous",
}: {
  options: FilterOption[];
  active?: string;
  baseHref: string;
  paramName: string;
  allLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={baseHref}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          !active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {allLabel}
      </Link>
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={`${baseHref}?${paramName}=${encodeURIComponent(opt.value)}`}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            active === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label} <span className="opacity-70">({opt.count})</span>
        </Link>
      ))}
    </div>
  );
}
