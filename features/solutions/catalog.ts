import { z } from "zod";

export const SECTORS = { HEALTH: "Santé", EDUCATION: "Éducation", AGRICULTURE: "Agriculture", FINANCE: "Finance", CIVIC: "Services publics et citoyenneté", ENERGY: "Énergie", INFRASTRUCTURE: "Infrastructure numérique", OTHER: "Autres usages" } as const;
export const LIFECYCLES = { EXPERIMENTAL: "Expérimental", USABLE: "Utilisable", MAINTAINED: "Maintenu", ARCHIVED: "Archivé" } as const;

const url = z.string().trim().max(500).refine(value => {
  if (!value) return true;
  try { const parsed = new URL(value); return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password; } catch { return false; }
}, "Indiquez une URL HTTP ou HTTPS sans identifiants.");
const list = z.string().max(500).transform(value => [...new Set(value.split(",").map(item => item.trim()).filter(Boolean))]).refine(value => value.length <= 20 && value.every(item => item.length <= 80), "20 valeurs maximum, de 80 caractères chacune.");

export const catalogSchema = z.object({
  repositoryUrl: url.default(""),
  websiteUrl: url.default(""),
  documentationUrl: url.default(""),
  sector: z.enum(Object.keys(SECTORS) as [keyof typeof SECTORS, ...(keyof typeof SECTORS)[]]).default("OTHER"),
  lifecycle: z.enum(Object.keys(LIFECYCLES) as [keyof typeof LIFECYCLES, ...(keyof typeof LIFECYCLES)[]]).default("EXPERIMENTAL"),
  countriesServed: list.prefault(""),
  languages: list.prefault(""),
  contributionNeeds: z.string().trim().max(2000).default(""),
  africanContext: z.string().trim().max(2000).default(""),
});

export const claimSchema = z.object({
  solutionId: z.string().min(1).max(100),
  evidence: z.string().trim().min(40, "Expliquez votre lien avec la solution et la preuve à vérifier (40 caractères minimum).").max(3000),
});

export const reviewClaimSchema = z.object({
  id: z.string().min(1).max(100),
  revision: z.coerce.number().int().positive(),
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().trim().min(20, "Expliquez la vérification et votre décision (20 caractères minimum).").max(2000),
  confirmed: z.string().optional(),
}).refine(value => value.status !== "APPROVED" || value.confirmed === "on", { message: "Confirmez avoir vérifié le contrôle du projet avant d’accorder l’accès.", path: ["confirmed"] });

export function claimProofCode(id: string, userId: string) { return `afrocodeurs:${id}:${userId}`; }

export function catalogValues(form: FormData) {
  return Object.fromEntries(Object.keys(catalogSchema.shape).map(key => [key, form.get(key) ?? undefined]));
}

export function normalizeCatalogParams(params: Record<string, unknown>) {
  return Object.fromEntries(["q", "type", "sector", "country", "language", "license", "lifecycle", "open"].map(key => [key, typeof params[key] === "string" ? params[key].slice(0, 120) : undefined])) as Partial<Record<"q" | "type" | "sector" | "country" | "language" | "license" | "lifecycle" | "open", string>>;
}

export function catalogFilters(params: { q?: string; sector?: string; country?: string; language?: string; license?: string; lifecycle?: string; open?: string }) {
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  return {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }, { africanContext: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(params.sector && Object.hasOwn(SECTORS, params.sector) ? { sector: params.sector } : {}),
    ...(params.lifecycle && Object.hasOwn(LIFECYCLES, params.lifecycle) ? { lifecycle: params.lifecycle } : {}),
    ...(params.country ? { countriesServed: { has: params.country.slice(0, 80) } } : {}),
    ...(params.language ? { languages: { has: params.language.slice(0, 80) } } : {}),
    ...(params.license ? { license: { equals: params.license.slice(0, 80), mode: "insensitive" as const } } : {}),
    ...(params.open === "1" ? { licenseVerified: true, repositoryUrl: { not: null } } : {}),
  };
}
