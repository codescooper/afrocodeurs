import type { CommunityType } from "@prisma/client";

/** Libellés FR des types de communauté (cf. schéma Prisma `CommunityType`). */
export const COMMUNITY_TYPE_LABELS: Record<CommunityType, string> = {
  SKILL: "Métier / Compétence",
  GEO: "Géographique",
  UNIVERSITY: "Université",
  SECTOR: "Secteur",
  PROJECT: "Projet",
};

/** Types ordonnés pour les menus déroulants. */
export const COMMUNITY_TYPES = Object.keys(
  COMMUNITY_TYPE_LABELS,
) as CommunityType[];
