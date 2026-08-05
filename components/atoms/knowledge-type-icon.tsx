import {
  FileText,
  GraduationCap,
  Compass,
  Briefcase,
  BookOpen,
  FolderOpen,
  Languages,
  type LucideIcon,
} from "lucide-react";
import type { KnowledgeType } from "@prisma/client";

const ICONS: Record<KnowledgeType, LucideIcon> = {
  ARTICLE: FileText,
  TUTORIAL: GraduationCap,
  GUIDE: Compass,
  CASE_STUDY: Briefcase,
  DOCUMENTATION: BookOpen,
  DOSSIER: FolderOpen,
  TRANSLATION: Languages,
};

/** Icône représentative d'un type de ressource (cf. KnowledgeType). */
export function knowledgeTypeIcon(type: KnowledgeType): LucideIcon {
  return ICONS[type];
}
