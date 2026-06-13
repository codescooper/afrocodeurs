import "server-only";

import type { EntityType } from "@prisma/client";

import { db } from "@/lib/db";

export type ReportTarget = {
  kind: string; // libellé FR du type de contenu
  title: string;
  href: string; // lien public pour consulter le contenu
  snippet: string | null;
  canHide: boolean; // le type supporte-t-il le masquage (archive / fermeture) ?
  authorLabel: string | null; // auteur du contenu (affichage), si applicable
  authorId: string | null; // auteur du contenu (pour le notifier)
};

/** Résout la cible polymorphe d'un signalement en aperçu affichable. */
export async function resolveReportTarget(
  type: EntityType,
  id: string,
): Promise<ReportTarget | null> {
  switch (type) {
    case "KNOWLEDGE": {
      const k = await db.knowledge.findUnique({
        where: { id },
        select: {
          title: true,
          slug: true,
          summary: true,
          author: { select: { id: true, username: true } },
        },
      });
      if (!k) return null;
      return {
        kind: "Ressource",
        title: k.title,
        href: `/knowledge/${k.slug}`,
        snippet: k.summary,
        canHide: true,
        authorLabel: `@${k.author.username}`,
        authorId: k.author.id,
      };
    }
    case "PROBLEM": {
      const p = await db.problem.findUnique({
        where: { id },
        select: {
          title: true,
          slug: true,
          summary: true,
          createdBy: { select: { id: true, username: true } },
        },
      });
      if (!p) return null;
      return {
        kind: "Problème",
        title: p.title,
        href: `/explorer/${p.slug}`,
        snippet: p.summary,
        canHide: true,
        authorLabel: `@${p.createdBy.username}`,
        authorId: p.createdBy.id,
      };
    }
    case "SOLUTION": {
      const s = await db.solution.findUnique({
        where: { id },
        select: {
          name: true,
          slug: true,
          description: true,
          createdBy: { select: { id: true, username: true } },
        },
      });
      if (!s) return null;
      return {
        kind: "Solution",
        title: s.name,
        href: `/atlas/${s.slug}`,
        snippet: s.description.slice(0, 240),
        canHide: false,
        authorLabel: `@${s.createdBy.username}`,
        authorId: s.createdBy.id,
      };
    }
    case "COMMUNITY": {
      const c = await db.community.findUnique({
        where: { id },
        select: { name: true, slug: true, description: true },
      });
      if (!c) return null;
      return {
        kind: "Communauté",
        title: c.name,
        href: `/communities/${c.slug}`,
        snippet: c.description,
        canHide: false,
        authorLabel: null,
        authorId: null,
      };
    }
    case "QUESTION": {
      const q = await db.question.findUnique({
        where: { id },
        select: {
          title: true,
          slug: true,
          body: true,
          author: { select: { id: true, username: true } },
        },
      });
      if (!q) return null;
      return {
        kind: "Question",
        title: q.title,
        href: `/forum/${q.slug}`,
        snippet: q.body.slice(0, 240),
        canHide: true,
        authorLabel: `@${q.author.username}`,
        authorId: q.author.id,
      };
    }
    case "ANSWER": {
      const a = await db.answer.findUnique({
        where: { id },
        select: {
          body: true,
          author: { select: { id: true, username: true } },
          question: { select: { slug: true, title: true } },
        },
      });
      if (!a) return null;
      return {
        kind: "Réponse",
        title: `Réponse à « ${a.question.title} »`,
        href: `/forum/${a.question.slug}`,
        snippet: a.body.slice(0, 240),
        canHide: false,
        authorLabel: `@${a.author.username}`,
        authorId: a.author.id,
      };
    }
    default:
      return null;
  }
}

/** Masque un contenu (archive / fermeture) — pour les types qui le supportent. */
export async function hideTarget(type: EntityType, id: string): Promise<void> {
  if (type === "KNOWLEDGE") {
    await db.knowledge.updateMany({ where: { id }, data: { status: "ARCHIVED" } });
  } else if (type === "PROBLEM") {
    await db.problem.updateMany({ where: { id }, data: { status: "ARCHIVED" } });
  } else if (type === "QUESTION") {
    await db.question.updateMany({ where: { id }, data: { status: "CLOSED" } });
  }
}

/** Supprime définitivement un contenu signalé (idempotent). */
export async function deleteTarget(type: EntityType, id: string): Promise<void> {
  switch (type) {
    case "KNOWLEDGE":
      await db.knowledge.deleteMany({ where: { id } });
      break;
    case "PROBLEM":
      await db.problem.deleteMany({ where: { id } });
      break;
    case "SOLUTION":
      await db.solution.deleteMany({ where: { id } });
      break;
    case "COMMUNITY":
      await db.community.deleteMany({ where: { id } });
      break;
    case "QUESTION":
      await db.question.deleteMany({ where: { id } });
      break;
    case "ANSWER":
      await db.answer.deleteMany({ where: { id } });
      break;
    default:
      break;
  }
}
