import countries from "i18n-iso-countries";
import fr from "i18n-iso-countries/langs/fr.json";
countries.registerLocale(fr);

export const COUNTRIES = Object.entries(countries.getNames("fr")).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, "fr"));
export const countryName = (code: string) => countries.getName(code, "fr") ?? code;
export const SECTORS = {
  EDUCATION: { label: "Éducation", color: "#f4c430" },
  HEALTH: { label: "Santé", color: "#6ee7b7" },
  AGRICULTURE: { label: "Agriculture", color: "#a3e635" },
  FINANCE: { label: "Finance", color: "#67e8f9" },
  COMMERCE: { label: "Commerce", color: "#fda4af" },
  ENVIRONMENT: { label: "Environnement", color: "#34d399" },
  CULTURE: { label: "Culture & médias", color: "#f0abfc" },
  SERVICES: { label: "Services & technologie", color: "#c4b5fd" },
  OTHER: { label: "Autre", color: "#d4d4d4" },
} as const;
export type Sector = keyof typeof SECTORS;
export const VENTURE_STATUS = { PENDING: "À valider", PUBLISHED: "Publiée", ARCHIVED: "Retirée", SUSPENDED: "Suspendue" };
export const COLLAB_STATUS = { PENDING: "En attente", ACCEPTED: "Acceptée", DECLINED: "Refusée", CANCELLED: "Annulée" };
