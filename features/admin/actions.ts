"use server";

import { revalidatePath } from "next/cache";
import type { EntityType, UserRole } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { reportSchema } from "@/lib/validators";
import { deleteTarget, hideTarget } from "./report-target";

export type ReportFormState = { error?: string; success?: boolean } | undefined;

const REPORTABLE: EntityType[] = [
  "PROBLEM",
  "KNOWLEDGE",
  "QUESTION",
  "ANSWER",
  "COMMUNITY",
  "SOLUTION",
];

/**
 * Traiter un signalement (Sprint 8) en agissant sur le contenu signalé, et
 * notifier l'auteur du signalement de la décision.
 * decision : "delete" (supprimer), "hide" (masquer), "dismiss" (rejeter).
 */
export async function moderateReportAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  if (!can(session.user.role, "report:handle")) return;

  const reportId = formData.get("reportId");
  const decision = formData.get("decision");
  if (typeof reportId !== "string") return;
  if (decision !== "delete" && decision !== "hide" && decision !== "dismiss") {
    return;
  }

  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.status !== "OPEN") return; // déjà traité

  let resolution: string;
  let notifBody: string;

  if (decision === "dismiss") {
    resolution = "Signalement rejeté — contenu conservé.";
    notifBody =
      "Après examen, le contenu que tu as signalé a été jugé conforme à nos règles et conservé. Merci de ta vigilance. 💛";
    await db.report.update({
      where: { id: reportId },
      data: { status: "REJECTED", resolution },
    });
  } else {
    if (decision === "hide") {
      await hideTarget(report.targetType, report.targetId);
      resolution = "Contenu masqué.";
      notifBody =
        "Le contenu que tu as signalé a été masqué par la modération. Merci de ta vigilance. 💛";
    } else {
      await deleteTarget(report.targetType, report.targetId);
      resolution = "Contenu supprimé.";
      notifBody =
        "Le contenu que tu as signalé a été supprimé par la modération. Merci de ta vigilance. 💛";
    }
    await db.report.update({
      where: { id: reportId },
      data: { status: "RESOLVED", resolution },
    });
  }

  // Notifier la personne qui a signalé.
  await db.notification.create({
    data: {
      userId: report.reporterId,
      type: "REPORT_HANDLED",
      title: "Ton signalement a été traité",
      body: notifBody,
      link: "/dashboard/notifications",
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/reports/${reportId}`);
  revalidatePath("/dashboard/notifications");
}

/** Modifier le rôle d'un utilisateur (Sprint 8). Réservé aux ADMIN. */
export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  if (!can(session.user.role, "user:manage")) return;

  const userId = formData.get("userId");
  const rawRole = formData.get("role");
  if (typeof userId !== "string") return;
  // On ne modifie pas son propre rôle (évite un auto-verrouillage).
  if (userId === session.user.id) return;
  if (
    rawRole !== "USER" &&
    rawRole !== "CONTRIBUTOR" &&
    rawRole !== "MODERATOR" &&
    rawRole !== "ADMIN"
  ) {
    return;
  }

  const role: UserRole = rawRole;
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

/** Signaler un contenu (Sprint 8). Ouvert à tout utilisateur connecté. */
export async function createReportAction(
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const rawType = formData.get("targetType");
  const targetId = formData.get("targetId");
  if (
    typeof rawType !== "string" ||
    !REPORTABLE.includes(rawType as EntityType)
  ) {
    return { error: "Cible invalide." };
  }
  if (typeof targetId !== "string") return { error: "Cible invalide." };

  await db.report.create({
    data: {
      reporterId: session.user.id,
      targetType: rawType as EntityType,
      targetId,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    },
  });

  return { success: true };
}
