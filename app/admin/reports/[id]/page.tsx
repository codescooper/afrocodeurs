import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReportStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { REPORT_REASON_LABELS } from "@/features/admin/constants";
import { resolveReportTarget } from "@/features/admin/report-target";
import { moderateReportAction } from "@/features/admin/actions";

export const metadata = { title: "Traiter un signalement" };

const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Ouvert",
  REVIEWING: "En cours",
  RESOLVED: "Résolu",
  REJECTED: "Rejeté",
};

/** Page de traitement d'un signalement : contexte + contenu + actions. */
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const canHandle = can(session?.user?.role, "report:handle");

  const report = await db.report.findUnique({
    where: { id },
    include: { reporter: { select: { username: true, name: true } } },
  });
  if (!report) notFound();

  const target = await resolveReportTarget(report.targetType, report.targetId);
  const isOpen = report.status === "OPEN";

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Administration
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Traiter un signalement</h1>
      </div>

      {/* Le signalement */}
      <section className="rounded-lg border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">
            {REPORT_REASON_LABELS[report.reason]}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {STATUS_LABELS[report.status]}
          </span>
        </div>
        {report.details && (
          <p className="mt-2 text-sm text-muted-foreground">
            « {report.details} »
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Signalé par @{report.reporter.username} ·{" "}
          {report.createdAt.toLocaleDateString("fr-FR")}
        </p>
        {report.resolution && (
          <p className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
            Décision : {report.resolution}
          </p>
        )}
      </section>

      {/* Le contenu signalé */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Contenu signalé
        </h2>
        {target ? (
          <div className="mt-3 rounded-lg border border-border p-5">
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              {target.kind}
            </span>
            <h3 className="mt-1 text-lg font-semibold">{target.title}</h3>
            {target.authorLabel && (
              <p className="text-xs text-muted-foreground">
                par {target.authorLabel}
              </p>
            )}
            {target.snippet && (
              <p className="mt-2 text-sm text-muted-foreground">
                {target.snippet}
              </p>
            )}
            <Link
              href={target.href}
              target="_blank"
              className="mt-3 inline-block text-sm text-accent hover:underline"
            >
              Voir le contenu ↗
            </Link>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            Le contenu signalé n&apos;existe plus (déjà supprimé).
          </p>
        )}
      </section>

      {/* Actions */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Action
        </h2>
        {!isOpen ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ce signalement a déjà été traité ({STATUS_LABELS[report.status]}).
            L&apos;auteur a été notifié.
          </p>
        ) : !canHandle ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Tu n&apos;as pas les droits pour traiter ce signalement.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-3">
              <form action={moderateReportAction}>
                <input type="hidden" name="reportId" value={report.id} />
                <input type="hidden" name="decision" value="dismiss" />
                <Button type="submit" variant="outline">
                  Rejeter le signalement
                </Button>
              </form>
              {target?.canHide && (
                <form action={moderateReportAction}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <input type="hidden" name="decision" value="hide" />
                  <Button type="submit" variant="secondary">
                    Masquer le contenu
                  </Button>
                </form>
              )}
              <form action={moderateReportAction}>
                <input type="hidden" name="reportId" value={report.id} />
                <input type="hidden" name="decision" value="delete" />
                <Button type="submit" variant="destructive">
                  Supprimer le contenu
                </Button>
              </form>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Quelle que soit la décision, l&apos;auteur du signalement reçoit
              une notification.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
