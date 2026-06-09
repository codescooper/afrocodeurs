import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import {
  CONTENT_STATUS_LABELS,
  KNOWLEDGE_TYPE_LABELS,
} from "@/features/knowledge/constants";

export const metadata = { title: "Mes contributions" };

/** Ressources rédigées par l'utilisateur courant, tous statuts (Sprint 4). */
export default async function ContributionsPage() {
  const session = await auth();
  const items = await db.knowledge.findMany({
    where: { authorId: session!.user.id },
    orderBy: { updatedAt: "desc" },
  });
  const canCreate = can(session!.user.role, "knowledge:create");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes contributions</h1>
          <p className="text-sm text-muted-foreground">
            Vos ressources et leur statut de validation.
          </p>
        </div>
        {canCreate && (
          <Link href="/knowledge/new" className={buttonVariants({ size: "sm" })}>
            Rédiger
          </Link>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Vous n&apos;avez pas encore rédigé de ressource.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/knowledge/${item.slug}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {KNOWLEDGE_TYPE_LABELS[item.type]}
                  </span>
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {CONTENT_STATUS_LABELS[item.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
