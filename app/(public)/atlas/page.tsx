import Link from "next/link";
import { MapPin } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { excerpt } from "@/lib/markdown";
import { SOLUTION_TYPE_LABELS } from "@/features/solutions/constants";

export const metadata = { title: "AfroAtlas" };

/** AfroAtlas Lite — annuaire des solutions (Sprint 6). */
export default async function AtlasPage() {
  const session = await auth();
  const solutions = await db.solution.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AfroAtlas</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Solutions, APIs, startups et organisations technologiques
            africaines.
          </p>
        </div>
        {session?.user && (
          <Link href="/atlas/new" className={buttonVariants({ size: "sm" })}>
            Ajouter une solution
          </Link>
        )}
      </div>

      {solutions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          L&apos;Atlas est vide. Ajoutez la première solution !
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution) => (
            <Link
              key={solution.id}
              href={`/atlas/${solution.slug}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-background p-5 transition-colors hover:bg-muted/40"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                {SOLUTION_TYPE_LABELS[solution.type]}
              </span>
              <h2 className="font-semibold">{solution.name}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {excerpt(solution.description)}
              </p>
              {solution.country && (
                <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {solution.country}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
