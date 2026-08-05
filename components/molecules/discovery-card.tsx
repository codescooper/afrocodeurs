import Link from "next/link";

export type DiscoveryItem = { label: string; href: string; meta?: string };

/** Carte "liste de liens" (problèmes récents, communautés actives, AfroMakers…). */
export function DiscoveryCard({
  title,
  subtitle,
  href,
  items,
  empty,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: DiscoveryItem[];
  empty: string;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-background p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link
          href={href}
          className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Tout voir →
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-primary"
              >
                <span className="line-clamp-1">{it.label}</span>
                {it.meta && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {it.meta}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
