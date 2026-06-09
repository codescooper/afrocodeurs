import { z } from "zod";

/** Schémas Zod partagés (validation côté serveur — cf. SDD §15). */

export const usernameSchema = z
  .string()
  .min(3, "Au moins 3 caractères")
  .max(30, "30 caractères maximum")
  .regex(/^[a-z0-9_]+$/, "Lettres minuscules, chiffres et _ uniquement");

export const signUpSchema = z.object({
  email: z.string().email("Email invalide"),
  username: usernameSchema,
  password: z.string().min(8, "Au moins 8 caractères"),
  name: z.string().min(1).max(80).optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
});

export const profileSchema = z.object({
  bio: z.string().max(500).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  languages: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
});

export const communitySchema = z.object({
  name: z
    .string()
    .min(3, "Au moins 3 caractères")
    .max(80, "80 caractères maximum"),
  description: z.string().max(500).optional(),
  type: z.enum(["SKILL", "GEO", "UNIVERSITY", "SECTOR", "PROJECT"]),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
});

export const problemSchema = z.object({
  title: z
    .string()
    .min(5, "Au moins 5 caractères")
    .max(140, "140 caractères maximum"),
  summary: z.string().max(280).optional(),
  description: z
    .string()
    .min(20, "Décrivez le problème (20 caractères minimum)"),
  sector: z.string().min(2, "Indiquez un secteur").max(80),
  countries: z.array(z.string()).default([]),
  impactLevel: z.coerce.number().int().min(1).max(5).default(1),
  difficultyLevel: z.coerce.number().int().min(1).max(5).default(1),
});

export const knowledgeSchema = z.object({
  title: z
    .string()
    .min(5, "Au moins 5 caractères")
    .max(160, "160 caractères maximum"),
  summary: z.string().max(300).optional(),
  content: z.string().min(50, "Le contenu doit faire au moins 50 caractères"),
  type: z.enum([
    "ARTICLE",
    "TUTORIAL",
    "GUIDE",
    "CASE_STUDY",
    "DOCUMENTATION",
    "DOSSIER",
    "TRANSLATION",
  ]),
  language: z.string().min(2).max(10).default("fr"),
  level: z.string().max(40).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CommunityInput = z.infer<typeof communitySchema>;
export type ProblemInput = z.infer<typeof problemSchema>;
export type KnowledgeInput = z.infer<typeof knowledgeSchema>;
