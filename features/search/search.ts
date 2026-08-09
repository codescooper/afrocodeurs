import "server-only";

import { db } from "@/lib/db";
import { getSearchClient } from "@/lib/meilisearch";

export type SearchHit = {
  title: string;
  href?: string;
  subtitle?: string;
};

export type SearchResults = {
  problems: SearchHit[];
  knowledge: SearchHit[];
  questions: SearchHit[];
  communities: SearchHit[];
  solutions: SearchHit[];
  projects: SearchHit[];
  users: SearchHit[];
  total: number;
};

const EMPTY: SearchResults = {
  problems: [],
  knowledge: [],
  questions: [],
  communities: [],
  solutions: [],
  projects: [],
  users: [],
  total: 0,
};

/**
 * Recherche globale multi-entités (Sprint 7 + Tâche #32).
 *
 * Tente d'utiliser Meilisearch si configuré (MEILISEARCH_HOST), avec recherche
 * plein texte tolérante aux fautes de frappe et classement par pertinence.
 * En cas d'absence de configuration ou d'erreur, bascule sur la recherche Postgres (ILIKE).
 */
export async function globalSearch(rawQuery: string): Promise<SearchResults> {
  const q = rawQuery.trim();
  if (q.length < 2) return EMPTY;

  const ms = getSearchClient();
  if (ms) {
    try {
      const limit = 10;
      const [problems, knowledge, questions, communities, solutions, projects, users] =
        await Promise.all([
          ms.index("problems").search(q, { limit }),
          ms.index("knowledge").search(q, { limit }),
          ms.index("questions").search(q, { limit }),
          ms.index("communities").search(q, { limit }),
          ms.index("solutions").search(q, { limit }),
          ms.index("projects").search(q, { limit }),
          ms.index("users").search(q, { limit }),
        ]);

      const results: SearchResults = {
        problems: problems.hits.map((h: Record<string, any>) => ({
          title: h.title,
          href: `/explorer/${h.slug}`,
          subtitle: h.sector,
        })),
        knowledge: knowledge.hits.map((h: Record<string, any>) => ({
          title: h.title,
          href: `/knowledge/${h.slug}`,
          subtitle: h.summary,
        })),
        questions: questions.hits.map((h: Record<string, any>) => ({
          title: h.title,
          href: `/forum/${h.slug}`,
        })),
        communities: communities.hits.map((h: Record<string, any>) => ({
          title: h.name,
          href: `/communities/${h.slug}`,
          subtitle: h.description,
        })),
        solutions: solutions.hits.map((h: Record<string, any>) => ({
          title: h.name,
          href: `/atlas/${h.slug}`,
          subtitle: h.description,
        })),
        projects: projects.hits.map((h: Record<string, any>) => ({
          title: h.name,
          href: `/projects/${h.slug}`,
          subtitle: h.description,
        })),
        users: users.hits.map((h: Record<string, any>) => ({
          title: h.name ?? h.username,
          href: `/u/${h.username}`,
          subtitle: `@${h.username}`,
        })),
        total: 0,
      };

      results.total =
        results.problems.length +
        results.knowledge.length +
        results.questions.length +
        results.communities.length +
        results.solutions.length +
        results.projects.length +
        results.users.length;

      return results;
    } catch (err) {
      console.warn("Meilisearch non disponible, basculement sur la recherche Postgres :", err);
    }
  }

  // Repli automatique sur Postgres (contains insensible à la casse)
  const match = { contains: q, mode: "insensitive" as const };
  const take = 10;

  const [problems, knowledge, questions, communities, solutions, projects, users] =
    await Promise.all([
      db.problem.findMany({
        where: { OR: [{ title: match }, { summary: match }, { sector: match }] },
        take,
        select: { title: true, slug: true, sector: true },
      }),
      db.knowledge.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ title: match }, { summary: match }],
        },
        take,
        select: { title: true, slug: true, summary: true },
      }),
      db.question.findMany({
        where: { OR: [{ title: match }, { body: match }] },
        take,
        select: { title: true, slug: true },
      }),
      db.community.findMany({
        where: { OR: [{ name: match }, { description: match }] },
        take,
        select: { name: true, slug: true, description: true },
      }),
      db.solution.findMany({
        where: { OR: [{ name: match }, { description: match }] },
        take,
        select: { name: true, slug: true, type: true },
      }),
      db.project.findMany({
        where: { OR: [{ name: match }, { description: match }] },
        take,
        select: { name: true, slug: true },
      }),
      db.user.findMany({
        where: { OR: [{ username: match }, { name: match }] },
        take,
        select: { username: true, name: true },
      }),
    ]);

  const results: SearchResults = {
    problems: problems.map((p) => ({
      title: p.title,
      href: `/explorer/${p.slug}`,
      subtitle: p.sector,
    })),
    knowledge: knowledge.map((k) => ({
      title: k.title,
      href: `/knowledge/${k.slug}`,
      subtitle: k.summary ?? undefined,
    })),
    questions: questions.map((question) => ({
      title: question.title,
      href: `/forum/${question.slug}`,
    })),
    communities: communities.map((c) => ({
      title: c.name,
      href: `/communities/${c.slug}`,
      subtitle: c.description ?? undefined,
    })),
    solutions: solutions.map((s) => ({
      title: s.name,
      href: `/atlas/${s.slug}`,
    })),
    projects: projects.map((p) => ({
      title: p.name,
      href: `/projects/${p.slug}`,
    })),
    users: users.map((u) => ({
      title: u.name ?? u.username,
      href: `/u/${u.username}`,
      subtitle: `@${u.username}`,
    })),
    total: 0,
  };

  results.total =
    results.problems.length +
    results.knowledge.length +
    results.questions.length +
    results.communities.length +
    results.solutions.length +
    results.projects.length +
    results.users.length;

  return results;
}
