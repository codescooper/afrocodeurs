import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

const ACTION = { CREATE: "Création", UPDATE: "Modification", DELETE: "Suppression" } as const;

export default async function AuditAdminPage() {
  const session = await auth();
  if (!can(session?.user?.role, "content:manage")) redirect("/");
  const events = await db.auditLog.findMany({ include: { actor: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 250 });
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Journal des actions</h1>
      <p className="mt-1 text-sm text-muted-foreground">Historique immuable des 250 dernières mutations de contenu.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr><th className="p-3">Date</th><th className="p-3">Membre</th><th className="p-3">Action</th><th className="p-3">Type</th><th className="p-3">Référence</th></tr></thead><tbody>{events.map((event) => <tr key={event.id} className="border-t border-border"><td className="p-3 whitespace-nowrap">{event.createdAt.toLocaleString("fr-FR")}</td><td className="p-3">{event.actor ? `@${event.actor.username}` : "Compte supprimé"}</td><td className="p-3">{ACTION[event.action]}</td><td className="p-3">{event.entityType}</td><td className="p-3 font-mono text-xs">{event.entityId}</td></tr>)}</tbody></table></div>
    </div>
  );
}
