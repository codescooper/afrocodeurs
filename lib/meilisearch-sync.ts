import { db } from "@/lib/db";
import { getSearchClient, initMeilisearchIndexes, type SearchIndex } from "./meilisearch";

export type SyncResult = {
  success: boolean;
  counts: Record<SearchIndex, number>;
  error?: string;
};

/**
 * Synchronise l'ensemble des données de la base PostgreSQL vers Meilisearch.
 */
export async function syncAllToMeilisearch(): Promise<SyncResult> {
  const ms = getSearchClient();
  const counts: Record<SearchIndex, number> = {
    problems: 0,
    knowledge: 0,
    questions: 0,
    communities: 0,
    solutions: 0,
    projects: 0,
    users: 0,
  };

  if (!ms) {
    return {
      success: false,
      counts,
      error: "Meilisearch non configuré (MEILISEARCH_HOST absent).",
    };
  }

  try {
    await initMeilisearchIndexes();

    const [problems, knowledge, questions, communities, solutions, projects, users] =
      await Promise.all([
        db.problem.findMany({
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            description: true,
            sector: true,
          },
        }),
        db.knowledge.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            content: true,
          },
        }),
        db.question.findMany({
          select: {
            id: true,
            title: true,
            slug: true,
            body: true,
          },
        }),
        db.community.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            country: true,
            city: true,
          },
        }),
        db.solution.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            country: true,
            type: true,
          },
        }),
        db.project.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            githubRepo: true,
          },
        }),
        db.user.findMany({
          select: {
            id: true,
            username: true,
            name: true,
          },
        }),
      ]);

    if (problems.length > 0) {
      await ms.index("problems").addDocuments(problems);
      counts.problems = problems.length;
    }
    if (knowledge.length > 0) {
      await ms.index("knowledge").addDocuments(knowledge);
      counts.knowledge = knowledge.length;
    }
    if (questions.length > 0) {
      await ms.index("questions").addDocuments(questions);
      counts.questions = questions.length;
    }
    if (communities.length > 0) {
      await ms.index("communities").addDocuments(communities);
      counts.communities = communities.length;
    }
    if (solutions.length > 0) {
      await ms.index("solutions").addDocuments(solutions);
      counts.solutions = solutions.length;
    }
    if (projects.length > 0) {
      await ms.index("projects").addDocuments(projects);
      counts.projects = projects.length;
    }
    if (users.length > 0) {
      await ms.index("users").addDocuments(users);
      counts.users = users.length;
    }

    return { success: true, counts };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Erreur lors de la synchronisation Meilisearch :", err);
    return { success: false, counts, error: errorMsg };
  }
}
