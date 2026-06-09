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

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
