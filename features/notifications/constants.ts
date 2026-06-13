export type NotificationCategory =
  | "FORUM"
  | "CONTRIBUTIONS"
  | "PROBLEMS"
  | "COMMUNITY"
  | "ACCOUNT"
  | "MODERATION";

/** Catégories réglables par l'utilisateur (préférences de notification). */
export const NOTIFICATION_CATEGORIES: {
  key: NotificationCategory;
  label: string;
  description: string;
}[] = [
  {
    key: "FORUM",
    label: "Forum",
    description: "Réponses à tes questions, réponse acceptée, commentaires",
  },
  {
    key: "CONTRIBUTIONS",
    label: "Mes contributions",
    description: "Ressource publiée ou refusée, contenu modéré",
  },
  {
    key: "PROBLEMS",
    label: "Problèmes",
    description: "Solutions et ressources liées à tes problèmes",
  },
  {
    key: "COMMUNITY",
    label: "Communautés",
    description: "Nouveaux membres de tes communautés",
  },
  { key: "ACCOUNT", label: "Compte", description: "Changements de rôle" },
  {
    key: "MODERATION",
    label: "Modération",
    description: "Suites données à tes signalements",
  },
];

const TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  ANSWER: "FORUM",
  ANSWER_ACCEPTED: "FORUM",
  COMMENT: "FORUM",
  KNOWLEDGE_PUBLISHED: "CONTRIBUTIONS",
  KNOWLEDGE_REJECTED: "CONTRIBUTIONS",
  CONTENT_MODERATED: "CONTRIBUTIONS",
  PROBLEM_LINK: "PROBLEMS",
  COMMUNITY_JOIN: "COMMUNITY",
  ROLE_CHANGED: "ACCOUNT",
  REPORT_HANDLED: "MODERATION",
};

/** Catégorie réglable d'un type de notification (null si non réglable). */
export function categoryForType(type: string): NotificationCategory | null {
  return TYPE_TO_CATEGORY[type] ?? null;
}
