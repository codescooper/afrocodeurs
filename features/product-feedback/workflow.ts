import type {
  DevelopmentGoalStatus,
  FeedbackStatus,
  ProblemStatus,
  QuestionStatus,
} from "@prisma/client";

type AttributionFeedback = {
  submittedByLabel?: string | null;
  author?: { username?: string | null; name?: string | null } | null;
};

export function feedbackStatusForGoal(
  status: DevelopmentGoalStatus,
): FeedbackStatus {
  if (status === "PLANNED") return "CONVERTED";
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "SHIPPED") return "RESOLVED";
  return "REJECTED";
}

export function problemStatusForGoal(
  status: DevelopmentGoalStatus,
): ProblemStatus {
  if (status === "PLANNED") return "VALIDATED";
  if (status === "IN_PROGRESS") return "ACTIVE";
  return "ARCHIVED";
}

export function questionStatusForGoal(
  status: DevelopmentGoalStatus,
): QuestionStatus {
  if (status === "SHIPPED") return "SOLVED";
  if (status === "CANCELLED") return "CLOSED";
  return "ANSWERED";
}

export function releaseVersion(date: Date): string {
  const value = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Abidjan",
  }).format(date);
  return value.charAt(0).toLocaleUpperCase("fr") + value.slice(1);
}

export function releaseSummary(summary: string, maxLength = 320): string {
  const normalized = summary.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function feedbackAttribution(
  feedback: AttributionFeedback[],
): string {
  const labels = feedback
    .map((item) => {
      if (item.submittedByLabel?.trim()) return item.submittedByLabel.trim();
      if (item.author?.username) return `@${item.author.username}`;
      return item.author?.name?.trim() || null;
    })
    .filter((label): label is string => Boolean(label));
  const unique = [...new Set(labels)];
  if (unique.length === 0) return "La communauté AfroCodeurs";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} et ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")} et ${unique.at(-1)}`;
}
