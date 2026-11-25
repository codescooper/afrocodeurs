import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await auth();
  if (!can(session?.user?.role, "system:manage")) return new Response("Accès réservé", { status: 403 });
  const rows = await db.kitDownloadEvent.findMany({ where: { kit: "premier-agent-ia", createdAt: { gte: new Date(Date.now() - 90 * 86400000) } }, orderBy: { createdAt: "desc" }, take: 10000 });
  const fields = ["id", "createdAt", "status", "source", "referrer", "device", "os", "browser", "automated", "bytes", "version"] as const;
  const quote = (v: unknown) => '"' + String(v instanceof Date ? v.toISOString() : v).replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const csv = [fields.join(","), ...rows.map(r => fields.map(f => quote(r[f])).join(","))].join("\r\n");
  return new Response("\ufeff" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="telechargements-kit-ia.csv"', "Cache-Control": "private, no-store" } });
}
