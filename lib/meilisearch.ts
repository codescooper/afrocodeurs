import { Meilisearch } from "meilisearch";

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

let client: Meilisearch | null = null;

/** Client Meilisearch partagé (lazy). Retourne null si non configuré. */
export function getSearchClient(): Meilisearch | null {
  const host = process.env.MEILISEARCH_HOST;
  if (!host) return null;
  if (!client) {
    client = new Meilisearch({
      host,
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }
  return client;
}
