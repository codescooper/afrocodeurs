import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind en gérant les conflits (shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slug URL-safe depuis un titre (gère les accents). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalise une chaîne optionnelle : "" / undefined → null (base propre). */
export function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Transforme une saisie « a, b, c » en tableau nettoyé (sans entrées vides). */
export function parseList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Extrait le login GitHub d'une URL de profil (`github.com/<login>`), sinon null. */
export function githubLoginFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([A-Za-z0-9-]+)/);
  return m ? m[1] : null;
}

/**
 * Génère un slug unique : slugifie `base` (ou `fallback` si vide), puis ajoute
 * un suffixe -2, -3… tant que `exists(slug)` renvoie vrai.
 */
export async function uniqueSlug(
  base: string,
  fallback: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || fallback;
  let slug = root;
  let n = 2;
  while (await exists(slug)) slug = `${root}-${n++}`;
  return slug;
}
