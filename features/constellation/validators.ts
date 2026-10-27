import { z } from "zod";
import countries from "i18n-iso-countries";
import { SECTORS } from "./constants";
import { parseKeywords } from "./keywords";

export function publicWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      url.hostname.includes(".") && !/^[\d.]+$/.test(url.hostname) &&
      !/(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname) && !url.hostname.includes(":");
  } catch { return false; }
}
export function trustedMedia(value: string, env: Record<string, string | undefined> = process.env): boolean {
  if (!value) return true;
  if (/^\/uploads\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|gif)$/.test(value) && !value.includes("..")) return true;
  const bases = [env.NEXT_PUBLIC_SITE_URL, env.S3_PUBLIC_URL, env.S3_ENDPOINT && env.S3_BUCKET ? `${env.S3_ENDPOINT}/${env.S3_BUCKET}` : undefined].filter(Boolean);
  return bases.some((base) => {
    try {
      const root = new URL(base!);
      const url = new URL(value);
      const prefix = `${root.pathname.replace(/\/$/, "")}/uploads/`;
      return !url.username && !url.password && url.origin === root.origin && url.pathname.startsWith(prefix) && !url.search && !url.hash && /\.(png|jpe?g|webp|gif)$/.test(url.pathname);
    } catch { return false; }
  });
}
export const ventureSchema = z.object({
  id: z.string().max(100).optional(),
  revision: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(3, "Le nom doit contenir au moins 3 caractères.").max(100, "Le nom ne peut pas dépasser 100 caractères."),
  summary: z.string().trim().min(20, "Le résumé doit contenir au moins 20 caractères.").max(180, "Le résumé ne peut pas dépasser 180 caractères."),
  description: z.string().trim().min(80, "La présentation doit contenir au moins 80 caractères.").max(6000, "La présentation ne peut pas dépasser 6 000 caractères."),
  country: z.string().toUpperCase().refine((value) => countries.isValid(value) && value.length === 2, "Choisis un pays."),
  sector: z.enum(Object.keys(SECTORS) as [keyof typeof SECTORS, ...Array<keyof typeof SECTORS>]),
  websiteUrl: z.string().trim().max(500).refine(publicWebsite, "Indique le lien HTTPS public du service déployé."),
  logoUrl: z.string().max(1000).refine((v) => trustedMedia(v), "Utilise un logo téléversé sur la plateforme.").default(""),
  screenshots: z.string().max(3100).transform((v) => v.split("\n").map((s) => s.trim()).filter(Boolean)).pipe(z.array(z.string().refine((v) => trustedMedia(v), "Capture non autorisée.")).max(3)),
  needs: z.string().max(300, "Les mots-clés ne peuvent pas dépasser 300 caractères au total.").transform(parseKeywords).pipe(z.array(z.string().min(1).max(50, "Un mot-clé ne peut pas dépasser 50 caractères.")).max(6, "Choisis au maximum 6 mots-clés de collaboration.")),
  openSourceProjectId: z.string().max(100).default(""),
  confirmed: z.literal("on", { error: "Confirme que tu représentes cette réalisation et peux la présenter." }),
}).refine(value => !value.id || value.revision !== undefined, { message: "La version de la fiche manque. Recharge la page avant de modifier.", path: ["revision"] });
export const collaborationSchema = z.discriminatedUnion("command", [
  z.object({ command: z.literal("request"), id: z.string().min(1).max(100), message: z.string().trim().min(40).max(2000) }),
  z.object({ command: z.literal("respond"), id: z.string().min(1).max(100), revision: z.coerce.number().int().positive(), status: z.enum(["ACCEPTED", "DECLINED", "CANCELLED"]) }),
  z.object({ command: z.literal("block"), id: z.string().min(1).max(100) }),
  z.object({ command: z.literal("unblock"), id: z.string().min(1).max(100) }),
]);
export type CollaborationCommand = z.infer<typeof collaborationSchema>;
