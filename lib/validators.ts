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

export const solutionSchema = z.object({
  name: z
    .string()
    .min(2, "Au moins 2 caractères")
    .max(120, "120 caractères maximum"),
  description: z
    .string()
    .min(20, "Décrivez la solution (20 caractères minimum)"),
  type: z.enum(["SOFTWARE", "API", "STARTUP", "ORGANIZATION", "SERVICE"]),
  country: z.string().max(80).optional(),
  websiteUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  documentationUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  license: z.string().max(80).optional(),
});

export const questionSchema = z.object({
  title: z
    .string()
    .min(8, "Au moins 8 caractères")
    .max(160, "160 caractères maximum"),
  body: z.string().min(20, "Détaillez votre question (20 caractères minimum)"),
});

export const answerSchema = z.object({
  body: z
    .string()
    .min(10, "Votre réponse est trop courte (10 caractères minimum)"),
});

export const commentSchema = z.object({
  body: z
    .string()
    .min(2, "Commentaire trop court")
    .max(1000, "1000 caractères maximum"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CommunityInput = z.infer<typeof communitySchema>;
export type ProblemInput = z.infer<typeof problemSchema>;
export type KnowledgeInput = z.infer<typeof knowledgeSchema>;
export type SolutionInput = z.infer<typeof solutionSchema>;
export const reportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "PLAGIARISM",
    "MISINFORMATION",
    "OFF_TOPIC",
    "INAPPROPRIATE",
    "OTHER",
  ]),
  details: z.string().max(500).optional(),
});

export const accountSchema = z.object({
  name: z.string().min(1, "Le nom ne peut pas être vide").max(80),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Au moins 8 caractères"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Au moins 8 caractères"),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
