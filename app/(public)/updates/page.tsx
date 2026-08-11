import { CheckCheck, Rocket } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import { markPlatformUpdatesReadAction } from "@/features/updates/actions";

export const metadata = { title: "Nouveautés" };

export default async function UpdatesPage() {
  const session = await auth();
  const updates = session?.user
    ? await db.platformUpdate.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, include: { reads: { where: { userId: session.user.id }, select: { id: true } } } })
    : (await db.platformUpdate.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } })).map((update) => ({ ...update, reads: [] as { id: string }[] }));
  const unread = session?.user ? updates.some((update) => update.reads.length === 0) : false;
  return <div className="mx-auto w-full max-w-4xl px-4 py-12"><header className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-primary"><Rocket className="size-5" /><span className="text-xs font-semibold uppercase tracking-[.2em]">Journal de la plateforme</span></div><h1 className="mt-2 text-4xl font-bold tracking-tight">Nouveautés AfroCodeurs</h1><p className="mt-3 max-w-2xl text-muted-foreground">Suivez les fonctionnalités disponibles, les améliorations et les prochaines étapes de la plateforme.</p></div>{unread && <form action={markPlatformUpdatesReadAction}><Button type="submit" variant="outline"><CheckCheck /> Tout marquer comme consulté</Button></form>}</header>
  <div className="mt-10 space-y-8">{updates.map((update) => { const isUnread = session?.user && update.reads.length === 0; return <article key={update.id} className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 sm:p-8">{isUnread && <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">Nouveau</span>}<div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><span>{update.category}</span><span aria-hidden>·</span><span>{update.version}</span><span aria-hidden>·</span><time>{(update.publishedAt ?? update.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</time></div><h2 className="mt-3 pr-16 text-2xl font-bold">{update.title}</h2><p className="mt-2 text-muted-foreground">{update.summary}</p><div className="mt-6 border-t border-border pt-6"><Markdown>{update.content}</Markdown></div></article>; })}{updates.length === 0 && <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Le journal sera bientôt disponible.</p>}</div></div>;
}
