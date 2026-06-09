import Link from "next/link";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Button, buttonVariants } from "@/components/ui/button";
import { moderateKnowledgeAction } from "@/features/knowledge/actions";
import { KNOWLEDGE_TYPE_LABELS } from "@/features/knowledge/constants";
import { resolveReportAction } from "@/features/admin/actions";
import { REPORT_REASON_LABELS } from "@/features/admin/constants";

export const metadata = { title: "Administration" };

/** Panneau d'administration : validation, signalements, utilisateurs (Sprint 8). */
export default async function AdminPage() {
  const session = await auth();
  const isAdmin = can(session?.user?.role, "user:manage");

  const [pending, reports, userCount] = await Promise.all([
    db.knowledge.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { username: true, name: true } } },
    }),
    db.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { username: true } } },
    }),
    db.user.count(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Administration</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          ["Membres", userCount],
          ["À valider", pending.length],
          ["Signalements", reports.length],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-background p-5 text-center"
          >
            <div className="text-2xl font-bold text-primary">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div>
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Gérer les utilisateurs
          </Link>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold">Contenus à valider</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun contenu en attente.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {pending.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <span className="flex flex-col">
                  <Link
                    href={`/knowledge/${item.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {KNOWLEDGE_TYPE_LABELS[item.type]} · par{" "}
                    {item.author.name ?? `@${item.author.username}`}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={moderateKnowledgeAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <input type="hidden" name="decision" value="publish" />
                    <Button type="submit" size="sm">
                      Publier
                    </Button>
                  </form>
                  <form action={moderateKnowledgeAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="slug" value={item.slug} />
                    <input type="hidden" name="decision" value="reject" />
                    <Button type="submit" size="sm" variant="destructive">
                      Rejeter
                    </Button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Signalements ouverts</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun signalement ouvert.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <span className="flex flex-col">
                  <span className="font-medium">
                    {REPORT_REASON_LABELS[report.reason]} ·{" "}
                    <span className="text-xs uppercase text-muted-foreground">
                      {report.targetType}
                    </span>
                  </span>
                  {report.details && (
                    <span className="text-xs text-muted-foreground">
                      {report.details}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    signalé par @{report.reporter.username}
                  </span>
                </span>
                <span className="flex gap-2">
                  <form action={resolveReportAction}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="decision" value="resolve" />
                    <Button type="submit" size="sm">
                      Résoudre
                    </Button>
                  </form>
                  <form action={resolveReportAction}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="decision" value="reject" />
                    <Button type="submit" size="sm" variant="outline">
                      Rejeter
                    </Button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
