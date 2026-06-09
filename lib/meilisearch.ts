import { MeiliSearch } from "meilisearch";

/** Index Meilisearch par type d'entité (cf. SDD §9). */
export const SEARCH_INDEXES = [
  "problems",
  "knowledge",
  "questions",
  "communities",
  "solutions",
  "users",
] as const;

export type SearchIndex = (typeof SEARCH_INDEXES)[number];

let client: MeiliSearch | null = null;

/** Client Meilisearch partagé (lazy). Retourne null si non configuré. */
export function getSearchClient(): MeiliSearch | null {
  const host = process.env.MEILISEARCH_HOST;
  if (!host) return null;
  if (!client) {
    client = new MeiliSearch({
      host,
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }
  return client;
}
