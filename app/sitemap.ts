import type { MetadataRoute } from "next";

import { db } from "@/lib/db";

// Généré à l'exécution (interroge la base) — jamais prérendu au build.
export const dynamic = "force-dynamic";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/explorer",
    "/knowledge",
    "/atlas",
    "/forum",
    "/communities",
    "/afromakers",
    "/projects",
    "/opportunities",
    "/confidentialite",
    "/conditions",
    "/mentions-legales",
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const [problems, knowledge, solutions, questions, communities, projects] =
    await Promise.all([
      db.problem.findMany({ select: { slug: true, updatedAt: true }, take: 2000 }),
      db.knowledge.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        take: 2000,
      }),
      db.solution.findMany({ select: { slug: true, updatedAt: true }, take: 2000 }),
      db.question.findMany({ select: { slug: true, updatedAt: true }, take: 2000 }),
      db.community.findMany({ select: { slug: true, updatedAt: true }, take: 2000 }),
      db.project.findMany({ select: { slug: true, updatedAt: true }, take: 2000 }),
    ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...problems.map((p) => ({
      url: `${base}/explorer/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...knowledge.map((k) => ({
      url: `${base}/knowledge/${k.slug}`,
      lastModified: k.updatedAt,
    })),
    ...solutions.map((s) => ({
      url: `${base}/atlas/${s.slug}`,
      lastModified: s.updatedAt,
    })),
    ...questions.map((q) => ({
      url: `${base}/forum/${q.slug}`,
      lastModified: q.updatedAt,
    })),
    ...communities.map((c) => ({
      url: `${base}/communities/${c.slug}`,
      lastModified: c.updatedAt,
    })),
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
