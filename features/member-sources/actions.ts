"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { guard } from "@/lib/guard";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeSourceUrl } from "@/lib/member-feed";
import { itemKey, refreshSource } from "./service";

export async function sourceAction(form: FormData) {
  const g = await guard({ verified: true });
  if (!g.ok) redirect(`/dashboard/sources?error=${encodeURIComponent(g.error)}`);
  const userId = g.user.id;
  let error = "";
  try {
    if (!rateLimit(`sources:${userId}`, 20, 60_000).ok) throw new Error("Trop de demandes. Réessayez dans une minute.");
    const operation = String(form.get("operation"));
    const id = String(form.get("id") || "");
    if (operation === "add") {
      if (form.get("consent") !== "on") throw new Error("Votre consentement est nécessaire pour cette source.");
      const kind = form.get("kind") === "github" ? "github" : "feed";
      const url = normalizeSourceUrl(String(form.get("url") || ""), kind);
      const source = await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
        const existing = await tx.memberSource.findUnique({ where: { userId_url: { userId, url } } });
        if (existing) return existing;
        if (await tx.memberSource.count({ where: { userId } }) >= 10) throw new Error("Limite : 10 sources par membre.");
        return tx.memberSource.create({ data: { userId, url, kind } });
      });
      await refreshSource(source.id, userId);
    } else if (operation === "refresh") {
      await refreshSource(id, userId);
    } else if (operation === "remove") {
      await db.memberSource.deleteMany({ where: { id, userId } });
    } else if (operation === "manual") {
      const url = new URL(normalizeSourceUrl(String(form.get("url") || ""), "feed"));
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error("Lien public HTTP(S) requis.");
      const title = String(form.get("title") || "").trim().slice(0, 200);
      const summary = String(form.get("summary") || "").trim().slice(0, 2000);
      if (!title || !summary) throw new Error("Titre et résumé nécessaires.");
      await db.memberUpdate.upsert({ where: { userId_externalId: { userId, externalId: itemKey(url.href) } }, create: { userId, externalId: itemKey(url.href), title, summary, url: url.href }, update: {} });
    } else if (operation === "publish" || operation === "hide") {
      await db.memberUpdate.updateMany({ where: { id, userId }, data: { approvedAt: operation === "publish" ? new Date() : null } });
    } else throw new Error("Action inconnue.");
  } catch (e) { error = e instanceof Error ? e.message : "Action impossible."; }
  revalidatePath("/dashboard/sources"); revalidatePath("/members-feed");
  redirect(`/dashboard/sources?${error ? `error=${encodeURIComponent(error)}` : "saved=1"}`);
}
