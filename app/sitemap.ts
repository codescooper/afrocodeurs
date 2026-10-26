import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

// Généré à l'exécution (interroge la base) — jamais prérendu au build.
export const dynamic = "force-dynamic";

const base = siteUrl().replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/a-propos",
    "/explorer",
    "/knowledge",
    "/atlas",
    "/forum",
    "/communities",
    "/afromakers",
    "/projects",
    "/mentorship",
    "/constellation",
    "/opportunities",
    "/events",
    "/challenges",
    "/updates",
    "/compensation",
    "/contact",
    "/confidentialite",
    "/conditions",
    "/mentions-legales",
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
  }));

  const [problems, knowledge, solutions, questions, communities, projects, events, ventures, mentors, challenges, opportunities] =
    await Promise.all([
      db.problem.findMany({ where: { status: { not: "ARCHIVED" } }, select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 2000 }),
      db.knowledge.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        take: 2000,
      }),
      db.solution.findMany({ select: { slug: true, updatedAt: true }, take: 2000 }),
      db.question.findMany({ where: { status: { not: "CLOSED" } }, select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 2000 }),
      db.community.findMany({ select: { slug: true, updatedAt: true }, take: 2000 }),
      db.project.findMany({ where: { status: { not: "ARCHIVED" } }, select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 2000 }),
      db.event.findMany({ where: { status: { not: "CANCELLED" } }, select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 2000 }),
      db.communityVenture.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, take: 2000 }),
      db.mentorshipOffer.findMany({ where: { active: true, suspendedAt: null, mentor: { emailVerified: { not: null } } }, select: { id: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 2000 }),
      db.challenge.findMany({ where: { status: { in: ["PUBLISHED", "CLOSED"] } }, select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 2000 }),
      db.opportunity.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 2000 }),
    ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...opportunities.map((opportunity) => ({ url: `${base}/opportunities/${opportunity.slug}`, lastModified: opportunity.updatedAt })),
    ...mentors.map((mentor) => ({ url: `${base}/mentorship/${mentor.id}`, lastModified: mentor.updatedAt })),
    ...challenges.map((challenge) => ({ url: `${base}/challenges/${challenge.slug}`, lastModified: challenge.updatedAt })),
    ...ventures.map((venture) => ({ url: `${base}/constellation/${venture.slug}`, lastModified: venture.updatedAt })),
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
    ...events.map((event) => ({
      url: `${base}/events/${event.slug}`,
      lastModified: event.updatedAt,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
