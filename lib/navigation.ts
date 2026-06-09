import {
  Compass,
  GraduationCap,
  Users,
  Map,
  Briefcase,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Navigation principale (cf. PRD UX/UI §3). 5 éléments max sur mobile. */
export const MAIN_NAV: NavItem[] = [
  { label: "Explorer", href: "/explorer", icon: Compass },
  { label: "Apprendre", href: "/knowledge", icon: GraduationCap },
  { label: "Communauté", href: "/communities", icon: Users },
  { label: "Atlas", href: "/atlas", icon: Map },
  { label: "Opportunités", href: "/opportunities", icon: Briefcase },
];

/** Barre mobile basse : 5 éléments maximum (cf. PRD UX/UI §3, §20). */
export const MOBILE_NAV: NavItem[] = [
  { label: "Explorer", href: "/explorer", icon: Compass },
  { label: "Apprendre", href: "/knowledge", icon: GraduationCap },
  { label: "Communauté", href: "/communities", icon: Users },
  { label: "Atlas", href: "/atlas", icon: Map },
  { label: "Profil", href: "/dashboard", icon: User },
];
