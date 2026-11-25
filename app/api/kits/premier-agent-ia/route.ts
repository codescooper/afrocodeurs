import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { after } from "next/server";
import { db } from "@/lib/db";
import { allowedDownloadOrigin, downloadMetadata } from "@/lib/kit-download-metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const KIT = "premier-agent-ia";

// GET/HEAD never count email previews as downloads.
export async function GET() { return Response.redirect(new URL("/kits/premier-agent-ia", process.env.NEXT_PUBLIC_SITE_URL || "https://afrocodeurs.org"), 303); }
export async function HEAD() { return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } }); }

export async function POST(request: Request) {
  if (!allowedDownloadOrigin(request)) return new Response("Origine refusée", { status: 403 });
  const metadata = downloadMetadata(request.headers, request.url);
  let bytes: Buffer;
  try { bytes = await readFile(path.join(process.cwd(), "resources", "premier-agent-ia.zip")); }
  catch {
    await db.kitDownloadEvent.create({ data: { kit: KIT, ...metadata, status: "ERROR", bytes: 0, version: "unavailable" } }).catch(() => {});
    return new Response("Le fichier est momentanément indisponible. Réessayez plus tard ou écrivez à codescooper@gmail.com.", { status: 503 });
  }
  const version = createHash("sha256").update(bytes).digest("hex");
  // Do not silently advertise tracking if the database is unavailable.
  try {
    await db.kitDownloadEvent.create({ data: { kit: KIT, ...metadata, status: "SERVED", bytes: bytes.length, version } });
  } catch { return new Response("Téléchargement temporairement indisponible. Réessayez dans quelques instants.", { status: 503 }); }

  after(async () => {
    try {
      await db.kitDownloadEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86400000) } } });
      if (metadata.source === "test" || metadata.automated) return;
      const owner = await db.user.findUnique({ where: { email: "codescooper@gmail.com" }, select: { id: true } });
      if (!owner) return;
      // At most one notification per minute; every event remains in the dashboard.
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(19251125)`;
        const recent = await tx.notification.findFirst({ where: { userId: owner.id, type: "KIT_DOWNLOAD", createdAt: { gte: new Date(Date.now() - 60000) } } });
        if (!recent) await tx.notification.create({ data: { userId: owner.id, type: "KIT_DOWNLOAD", title: "Kit IA : nouveau téléchargement servi", body: `Source : ${metadata.source} · ${metadata.device} · ${metadata.os}. Consultez le suivi pour toutes les demandes.`, link: "/admin/downloads" } });
      });
    } catch { console.error("kit-download: notification or retention failed"); }
  });
  return new Response(new Uint8Array(bytes), { headers: {
    "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="premier-agent-ia.zip"',
    "Content-Length": String(bytes.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "X-Kit-SHA256": version,
  } });
}
