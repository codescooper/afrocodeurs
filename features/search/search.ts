import "server-only";

import { db } from "@/lib/db";

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
 * Recherche globale multi-entités (Sprint 7).
 *
 * Implémentation actuelle : Postgres (`contains` insensible à la casse), qui
 * fonctionne sans dépendance externe. Voie d'upgrade production : Meilisearch
 * (client prêt dans lib/meilisearch.ts, indexes définis), à brancher ici quand
 * une instance est disponible.
 */
export async function globalSearch(rawQuery: string): Promise<SearchResults> {
  const q = rawQuery.trim();
  if (q.length < 2) return EMPTY;

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
