import type { ReportReason, UserRole } from "@prisma/client";

/** Libellés FR des motifs de signalement (cf. schéma Prisma `ReportReason`). */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harcèlement",
  PLAGIARISM: "Plagiat",
  MISINFORMATION: "Désinformation",
  OFF_TOPIC: "Hors-sujet",
  INAPPROPRIATE: "Inapproprié",
  OTHER: "Autre",
};

export const REPORT_REASONS = Object.keys(
  REPORT_REASON_LABELS,
) as ReportReason[];

/** Libellés FR des rôles (cf. schéma Prisma `UserRole`). */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "Membre",
  CONTRIBUTOR: "Contributeur",
  MODERATOR: "Modérateur",
  ADMIN: "Administrateur",
};

export const USER_ROLES: UserRole[] = [
  "USER",
  "CONTRIBUTOR",
  "MODERATOR",
  "ADMIN",
];
