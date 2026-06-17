import "server-only";

import { db } from "@/lib/db";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Item = { title: string; slug: string };

export type DigestRecipient = { id: string; email: string; name: string | null };

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

/** Construit le digest hebdo personnalisé d'un utilisateur (null si rien de neuf). */
export async function buildDigest(
  user: DigestRecipient,
  since: Date,
): Promise<{ subject: string; html: string; text: string } | null> {
  const followingIds = (
    await db.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    })
  ).map((f) => f.followingId);

  const [fromFollowed, knowledge, problems] = await Promise.all([
    followingIds.length
      ? db.knowledge.findMany({
          where: {
            status: "PUBLISHED",
            authorId: { in: followingIds },
            publishedAt: { gte: since },
          },
          select: { title: true, slug: true },
          orderBy: { publishedAt: "desc" },
          take: 5,
        })
      : Promise.resolve<Item[]>([]),
    db.knowledge.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: since } },
      select: { title: true, slug: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    db.problem.findMany({
      where: { createdAt: { gte: since } },
      select: { title: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (
    fromFollowed.length === 0 &&
    knowledge.length === 0 &&
    problems.length === 0
  ) {
    return null;
  }

  const section = (heading: string, items: Item[], prefix: string) =>
    items.length === 0
      ? ""
      : `<h3 style="margin:16px 0 8px">${heading}</h3><ul>${items
          .map(
            (i) =>
              `<li><a href="${base}${prefix}/${i.slug}">${escapeHtml(i.title)}</a></li>`,
          )
          .join("")}</ul>`;

  const html =
    `<p>Bonjour${user.name ? " " + escapeHtml(user.name) : ""},</p>` +
    `<p>Voici ce qui s'est passé cette semaine sur AfroCodeurs :</p>` +
    section("Des AfroMakers que tu suis", fromFollowed, "/knowledge") +
    section("Nouvelles ressources", knowledge, "/knowledge") +
    section("Nouveaux problèmes à résoudre", problems, "/explorer") +
    `<p style="margin-top:16px"><a href="${base}/dashboard">Ouvrir mon tableau de bord</a></p>` +
    `<p style="color:#888;font-size:12px">Gère tes préférences : ${base}/dashboard/notifications</p>`;

  const lines = [
    ...fromFollowed.map((i) => `- ${i.title} : ${base}/knowledge/${i.slug}`),
    ...knowledge.map((i) => `- ${i.title} : ${base}/knowledge/${i.slug}`),
    ...problems.map((i) => `- ${i.title} : ${base}/explorer/${i.slug}`),
  ];
  const text = `Bonjour${user.name ? " " + user.name : ""},\n\nCette semaine sur AfroCodeurs :\n${lines.join("\n")}\n\nTon tableau de bord : ${base}/dashboard`;

  return { subject: "Ton digest AfroCodeurs de la semaine", html, text };
}
