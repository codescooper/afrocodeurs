import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { importMemberFeed } from "@/lib/member-feed";

export const itemKey = (url: string) => createHash("sha256").update(url).digest("hex");
export async function refreshSource(id: string, userId: string) {
  const source = await db.memberSource.findFirst({ where: { id, userId } });
  if (!source) throw new Error("Source introuvable.");
  try {
    const items = await importMemberFeed(source.url, source.kind === "github" ? "github" : "feed");
    await db.$transaction(async tx => {
      // Lock source so a concurrent revocation cannot recreate its items.
      const exists = await tx.$queryRaw<Array<{id: string}>>`SELECT id FROM "MemberSource" WHERE id = ${id} FOR UPDATE`;
      if (!exists.length) throw new Error("Source retirée.");
      for (const item of items) {
        // Preserve the member-reviewed snapshot; remote edits never overwrite it.
        await tx.memberUpdate.upsert({
          where: { userId_externalId: { userId, externalId: itemKey(item.url) } },
          create: { userId, sourceId: id, externalId: itemKey(item.url), title: item.title, url: item.url, summary: item.summary, publishedAt: item.publishedAt ? new Date(item.publishedAt) : null },
          update: {},
        });
      }
      await tx.memberSource.update({ where: { id }, data: { lastCheckedAt: new Date(), lastError: null } });
    });
    return items.length;
  } catch {
    await db.memberSource.updateMany({ where: { id, userId }, data: { lastCheckedAt: new Date(), lastError: "Import impossible. Vérifiez le lien public puis réessayez." } });
    throw new Error("Import impossible. Vérifiez le lien public puis réessayez.");
  }
}
