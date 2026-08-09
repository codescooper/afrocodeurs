import { Meilisearch } from "meilisearch";

/** Index Meilisearch par type d'entité (cf. SDD §9). */
export const SEARCH_INDEXES = [
  "problems",
  "knowledge",
  "questions",
  "communities",
  "solutions",
  "projects",
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

/**
 * Configure et vérifie les index Meilisearch (searchableAttributes, primaryKey).
 */
export async function initMeilisearchIndexes(): Promise<boolean> {
  const ms = getSearchClient();
  if (!ms) return false;

  try {
    const settings: Record<SearchIndex, { primaryKey: string; searchableAttributes: string[] }> = {
      problems: {
        primaryKey: "id",
        searchableAttributes: ["title", "summary", "description", "sector"],
      },
      knowledge: {
        primaryKey: "id",
        searchableAttributes: ["title", "summary", "content"],
      },
      questions: {
        primaryKey: "id",
        searchableAttributes: ["title", "body"],
      },
      communities: {
        primaryKey: "id",
        searchableAttributes: ["name", "description", "country", "city"],
      },
      solutions: {
        primaryKey: "id",
        searchableAttributes: ["name", "description", "country"],
      },
      projects: {
        primaryKey: "id",
        searchableAttributes: ["name", "description", "githubRepo"],
      },
      users: {
        primaryKey: "id",
        searchableAttributes: ["username", "name"],
      },
    };

    for (const indexName of SEARCH_INDEXES) {
      const config = settings[indexName];
      const index = ms.index(indexName);
      await ms.createIndex(indexName, { primaryKey: config.primaryKey }).catch(() => {});
      await index.updateSearchableAttributes(config.searchableAttributes);
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des index Meilisearch :", error);
    return false;
  }
}
