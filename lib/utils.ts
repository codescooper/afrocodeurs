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
 * Normalise une base de username : accents retirés, minuscules, `[a-z0-9_]`
 * uniquement, 30 caractères max. Aligné sur `usernameSchema` (lib/validators).
 */
export function normalizeUsername(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
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

/**
 * Vrai si `error` est un conflit de contrainte unique Prisma (code `P2002`)
 * portant sur le champ `username`. Seule cette erreur peut être débloquée par
 * un retry avec un nouveau username — toute autre erreur doit remonter telle
 * quelle.
 */
export function isUsernameConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, meta } = error as {
    code?: unknown;
    meta?: { target?: string | string[] };
  };
  if (code !== "P2002") return false;
  const target = meta?.target;
  return Array.isArray(target) ? target.includes("username") : target === "username";
}

/**
 * Enveloppe un `createUser` d'adapter pour absorber les courses de génération
 * de username : le pré-check `findUnique` (dans `generateUniqueUsername`)
 * laisse une fenêtre entre la vérification et l'insertion, donc deux
 * inscriptions simultanées peuvent choisir le même username. Si l'insertion
 * échoue sur la contrainte unique `username` (P2002), on régénère un username
 * et on retente, jusqu'à `maxAttempts`. Un username déjà fourni (ex. compte
 * credentials) est conservé à la première tentative. Toute autre erreur
 * remonte immédiatement.
 */
/** Type « promesse ou valeur » (équivalent de `Awaitable` de next-auth/adapters). */
type Awaitable<T> = T | PromiseLike<T>;

export function withUsernameRetry<T>(
  createUser: (user: T) => Awaitable<T>,
  generateUsername: (user: T) => Promise<string>,
  maxAttempts = 5,
): (user: T) => Promise<T> {
  return async (user: T): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidate: T =
        attempt === 0 && (user as T & { username?: string | null }).username
          ? user
          : ({ ...user, username: await generateUsername(user) } as T);
      try {
        return await createUser(candidate);
      } catch (error) {
        if (isUsernameConflict(error)) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("Impossible de créer un nom d'utilisateur unique.");
  };
}
