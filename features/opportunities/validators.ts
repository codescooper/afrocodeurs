import { z } from "zod";

export const opportunitySchema = z.object({
  title: z.string().trim().min(5, "Titre trop court").max(160),
  organization: z.string().trim().min(2, "Indiquez l’organisation").max(120),
  type: z.enum(["JOB", "INTERNSHIP", "SCHOLARSHIP", "FUNDING", "COMPETITION", "MENTORSHIP", "EVENT", "OTHER"]),
  summary: z.string().trim().min(20, "Ajoutez un résumé d’au moins 20 caractères").max(320),
  description: z.string().trim().min(50, "Ajoutez une description détaillée d’au moins 50 caractères").max(12_000),
  requirements: z.string().trim().max(6_000).optional(),
  location: z.string().trim().max(120).optional(),
  externalUrl: z.union([z.literal(""), z.string().url("Lien invalide")]).optional(),
  deadline: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")]).optional(),
  isRemote: z.boolean(),
});

export const opportunityResponseSchema = z.object({
  opportunityId: z.string().min(1),
  kind: z.enum(["INTEREST", "APPLICATION"]),
  message: z.string().trim().max(2000).optional(),
}).refine((data) => data.kind !== "APPLICATION" || (data.message?.length ?? 0) >= 20, { message: "Présentez votre candidature en 20 caractères minimum", path: ["message"] });
