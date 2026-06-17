import Link from "next/link";
import { Bookmark } from "lucide-react";

import { auth } from "@/lib/auth";
import { getSavedItems } from "@/features/bookmarks/queries";

export const metadata = { title: "Mes favoris" };

export default async function SavedPage() {
  const session = await auth();
  const items = await getSavedItems(session!.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mes favoris</h1>
        <p className="text-sm text-muted-foreground">
          Les contenus que tu as enregistrés pour plus tard.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun favori pour l&apos;instant. Clique sur{" "}
          <Bookmark className="inline size-4 align-text-bottom" /> Enregistrer
          sur un problème ou une ressource.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="line-clamp-1 font-medium">{it.title}</span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {it.kind}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
