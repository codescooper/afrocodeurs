import type { OpportunityType } from "@prisma/client";

export const OPPORTUNITY_TYPES: OpportunityType[] = ["JOB", "INTERNSHIP", "SCHOLARSHIP", "FUNDING", "COMPETITION", "MENTORSHIP", "EVENT", "OTHER"];
export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  JOB: "Emploi", INTERNSHIP: "Stage", SCHOLARSHIP: "Bourse", FUNDING: "Financement",
  COMPETITION: "Concours", MENTORSHIP: "Mentorat", EVENT: "Événement", OTHER: "Autre",
};
