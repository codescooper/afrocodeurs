import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const ACTION = { CREATE: "Création", UPDATE: "Modification", DELETE: "Suppression" } as const;
export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const events = await db.auditLog.findMany({ where: { actorId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="mx-auto w-full max-w-4xl px-4 py-10"><h1 className="text-2xl font-bold">Historique de mes actions</h1><p className="mt-1 text-sm text-muted-foreground">Les 100 dernières créations, modifications et suppressions effectuées sur vos contenus.</p><ol className="mt-6 grid gap-3">{events.map((event) => <li key={event.id} className="rounded-lg border border-border bg-card p-4"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{ACTION[event.action]} · {event.entityType.toLocaleLowerCase("fr")}</span><time className="text-xs text-muted-foreground">{event.createdAt.toLocaleString("fr-FR")}</time></div><p className="mt-1 text-xs text-muted-foreground">Référence : {event.entityId}</p></li>)}</ol>{events.length === 0 && <p className="mt-8 text-muted-foreground">Aucune action enregistrée pour le moment.</p>}</div>;
}
