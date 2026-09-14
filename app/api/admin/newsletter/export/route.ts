import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function csvCell(value: string) {
  const safe = /^[=+-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Non authentifié", { status: 401 });
  if (!can(session.user.role, "newsletter:manage")) {
    return new Response("Accès interdit", { status: 403 });
  }

  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, source: true, createdAt: true },
  });
  const rows = [
    ["email", "source", "created_at"],
    ...subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.source,
      subscriber.createdAt.toISOString(),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": 'attachment; filename="afrocodeurs-newsletter.csv"',
      "content-type": "text/csv; charset=utf-8",
    },
  });
}
