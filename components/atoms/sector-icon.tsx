import {
  Sprout,
  HeartPulse,
  Landmark,
  Wifi,
  Fingerprint,
  GraduationCap,
  Truck,
  Zap,
  Layers,
  type LucideIcon,
} from "lucide-react";

const KEYWORDS: [RegExp, LucideIcon][] = [
  [/agri/i, Sprout],
  [/sant|health|médic/i, HeartPulse],
  [/fintech|finance|banc/i, Landmark],
  [/connect|télécom|network/i, Wifi],
  [/identité|identity/i, Fingerprint],
  [/edtech|éducat|education/i, GraduationCap],
  [/logistique|transport/i, Truck],
  [/énergie|energy/i, Zap],
];

/** Icône représentative d'un secteur (texte libre, cf. Problem.sector). Défaut : Layers. */
export function sectorIcon(sector: string): LucideIcon {
  const match = KEYWORDS.find(([pattern]) => pattern.test(sector));
  return match ? match[1] : Layers;
}
