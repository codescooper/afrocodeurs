import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { downloadRetentionCutoff } from "@/lib/kit-download-metadata";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suivi des téléchargements du kit IA" };
export default async function DownloadStats() {
  const session = await auth();
  if (!can(session?.user?.role, "system:manage")) redirect("/dashboard");
  const where = { kit: "premier-agent-ia", createdAt: { gte: downloadRetentionCutoff() } };
  const [counts, sources, events] = await Promise.all([
    db.kitDownloadEvent.groupBy({ by: ["status", "automated", "source"], where, _count: true }),
    db.kitDownloadEvent.groupBy({ by: ["source"], where: { ...where, status: "SERVED", automated: false }, _count: true }),
    db.kitDownloadEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const served = counts.filter(r => r.status === "SERVED" && !r.automated && r.source !== "test").reduce((n, r) => n + r._count, 0);
  const errors = counts.filter(r => r.status === "ERROR").reduce((n, r) => n + r._count, 0);
  const robots = counts.filter(r => r.automated).reduce((n, r) => n + r._count, 0);
  return <div className="space-y-6">
    <h1 className="text-3xl font-bold">Téléchargements du kit IA</h1>
    <p>Demandes des 90 derniers jours. Ce suivi ne mesure ni personnes uniques, ni fichiers enregistrés, ni ouverture du kit. Les répétitions et les robots non reconnus peuvent gonfler les chiffres.</p>
    <div className="grid gap-4 sm:grid-cols-3">{[["Demandes servies (hors tests et robots reconnus)", served], ["Erreurs", errors], ["Demandes de robots reconnus", robots]].map(([label, n]) => <div key={label} className="rounded-lg border border-border p-5"><strong className="block text-3xl text-primary">{n}</strong><span>{label}</span></div>)}</div>
    <p>Sources (tests indiqués séparément) : {sources.map(r => `${r.source} : ${r._count}`).join(" · ") || "Aucune demande"}</p>
    <a className="text-primary underline" href="/api/admin/kit-downloads">Exporter les événements en CSV (10 000 derniers maximum)</a>
    <h2 className="text-xl font-semibold">Les 200 derniers événements</h2>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Journal technique des téléchargements</caption><thead><tr>{["Date UTC", "Statut", "Source", "Référent", "Appareil", "Système", "Navigateur", "Robot", "Octets", "Version SHA-256"].map(s => <th key={s} className="whitespace-nowrap border-b p-2">{s}</th>)}</tr></thead><tbody>{events.map(r => <tr key={r.id}>{[r.createdAt.toISOString(), r.status, r.source, r.referrer, r.device, r.os, r.browser, r.automated ? "Oui" : "Non détecté", r.bytes, r.version].map((v, i) => <td className="max-w-64 break-words border-b p-2" key={i}>{v}</td>)}</tr>)}</tbody></table></div>
    <p className="text-sm text-muted-foreground">Aucune IP, email ou empreinte individuelle. Les événements de plus de 90 jours sont masqués et purgés au prochain téléchargement. Les notifications sont regroupées au plus une fois par minute ; tous les événements restent ici. L’origine et les caractéristiques sont déclaratives.</p>
  </div>;
}
