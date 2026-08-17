import {
  Home,
  Compass,
  GraduationCap,
  Users,
  Map,
  Briefcase,
  MessageSquare,
  MessagesSquare,
  Megaphone,
  Rocket,
  BrainCircuit,
  CalendarDays,
  BarChart3,
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
  { label: "Ressources", href: "/knowledge", icon: GraduationCap },
  { label: "Communauté", href: "/communities", icon: Users },
  { label: "Projets", href: "/projects", icon: Rocket },
  { label: "Forum", href: "/forum", icon: MessageSquare },
  { label: "Messages", href: "/messages", icon: MessagesSquare },
  { label: "Nouveautés & roadmap", href: "/updates", icon: Megaphone },
  { label: "Défis", href: "/challenges", icon: BrainCircuit },
  { label: "Événements", href: "/events", icon: CalendarDays },
  { label: "Observatoire", href: "/compensation", icon: BarChart3 },
  { label: "Atlas", href: "/atlas", icon: Map },
  { label: "Opportunités", href: "/opportunities", icon: Briefcase },
];

/** Barre mobile basse : 5 éléments maximum (cf. PRD UX/UI §3, §20). */
export const MOBILE_NAV: NavItem[] = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Explorer", href: "/explorer", icon: Compass },
  { label: "Ressources", href: "/knowledge", icon: GraduationCap },
  { label: "Communauté", href: "/communities", icon: Users },
];
