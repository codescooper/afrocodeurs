import type { ContentStatus, KnowledgeType } from "@prisma/client";

/** Libellés FR des types de ressource (cf. schéma Prisma `KnowledgeType`). */
export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  ARTICLE: "Article",
  TUTORIAL: "Tutoriel",
  GUIDE: "Guide",
  CASE_STUDY: "Étude de cas",
  DOCUMENTATION: "Documentation",
  DOSSIER: "Dossier",
  TRANSLATION: "Traduction",
};

export const KNOWLEDGE_TYPES = Object.keys(
  KNOWLEDGE_TYPE_LABELS,
) as KnowledgeType[];

/** Libellés FR des statuts de contenu (cf. schéma Prisma `ContentStatus`). */
export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "En validation",
  PUBLISHED: "Publié",
  REJECTED: "Rejeté",
  ARCHIVED: "Archivé",
};

/** Niveaux proposés (champ libre `level`). */
export const KNOWLEDGE_LEVELS = ["Débutant", "Intermédiaire", "Avancé"];
