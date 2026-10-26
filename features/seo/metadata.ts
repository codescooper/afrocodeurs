import "server-only";
import { db } from "@/lib/db";
import { PRIVATE_ROBOTS, publicMetadata } from "@/lib/seo";

const loaders = {
  communities: async (slug: string) => {
    const item = await db.community.findUnique({ where: { slug }, select: { name: true, description: true } });
    return item && { title: item.name, description: item.description || `Rencontre la communauté tech ${item.name} sur AfroCodeurs : échanges, entraide et projets.` };
  },
  constellation: async (slug: string) => {
    const item = await db.communityVenture.findFirst({ where: { slug, status: "PUBLISHED" }, select: { name: true, summary: true } });
    return item && { title: item.name, description: item.summary };
  },
  projects: async (slug: string) => {
    const item = await db.project.findFirst({ where: { slug, status: { not: "ARCHIVED" } }, select: { name: true, description: true } });
    return item && { title: item.name, description: item.description };
  },
  knowledge: async (slug: string) => {
    const item = await db.knowledge.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true, summary: true } });
    return item && { title: item.title, description: item.summary || `Ressource partagée par la communauté tech africaine AfroCodeurs : ${item.title}.` };
  },
  forum: async (slug: string) => {
    const item = await db.question.findFirst({ where: { slug, status: { not: "CLOSED" } }, select: { title: true, body: true } });
    return item && { title: item.title, description: item.body };
  },
  explorer: async (slug: string) => {
    const item = await db.problem.findFirst({ where: { slug, status: { not: "ARCHIVED" } }, select: { title: true, summary: true, description: true } });
    return item && { title: item.title, description: item.summary || item.description };
  },
  atlas: async (slug: string) => {
    const item = await db.solution.findUnique({ where: { slug }, select: { name: true, description: true } });
    return item && { title: item.name, description: item.description };
  },
  events: async (slug: string) => {
    const item = await db.event.findFirst({ where: { slug, status: { not: "CANCELLED" } }, select: { title: true, summary: true } });
    return item && { title: item.title, description: item.summary };
  },
  opportunities: async (slug: string) => {
    const item = await db.opportunity.findFirst({ where: { slug, status: "ACTIVE" }, select: { title: true, summary: true } });
    return item && { title: item.title, description: item.summary };
  },
  mentorship: async (id: string) => {
    const item = await db.mentorshipOffer.findFirst({ where: { id, active: true, suspendedAt: null, mentor: { emailVerified: { not: null } } }, select: { title: true, description: true } });
    return item && { title: item.title, description: item.description };
  },
  challenges: async (slug: string) => {
    const item = await db.challenge.findFirst({ where: { slug, status: { in: ["PUBLISHED", "CLOSED"] } }, select: { title: true, story: true } });
    return item && { title: item.title, description: item.story || `Défi de la communauté tech AfroCodeurs : ${item.title}.` };
  },
};

export async function publicContentMetadata(kind: keyof typeof loaders, slug: string) {
  const item = await loaders[kind](slug);
  return item ? publicMetadata(`/${kind}/${encodeURIComponent(slug)}`, item.title, item.description) : { robots: PRIVATE_ROBOTS };
}
