"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { saveVenture, reviewVenture, archiveVenture, collaborate, VentureError } from "./service";
import { ventureSchema, collaborationSchema } from "./validators";
export type VentureState = { error?: string; success?: string } | undefined;
function refresh() {
  revalidatePath("/constellation"); revalidatePath("/constellation/[slug]", "page");
  revalidatePath("/dashboard/constellation"); revalidatePath("/admin/constellation"); revalidatePath("/dashboard/notifications");
}
export async function saveVentureAction(_: VentureState, form: FormData): Promise<VentureState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  if (!rateLimit(`venture-save:${g.user.id}`, 10, 60 * 60 * 1000).ok) return { error: "Trop de modifications. Réessaie plus tard." };
  const parsed = ventureSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  try { await saveVenture(db, g.user.id, parsed.data); }
  catch (e) { if (e instanceof VentureError) return { error: e.message }; throw e; }
  refresh(); return { success: "Ta fiche est envoyée en validation. Retrouve-la dans Mes réalisations." };
}
export async function collaborationAction(_: VentureState, form: FormData): Promise<VentureState> {
  const parsed = collaborationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  const cancelOrBlock = parsed.data.command === "block" || parsed.data.command === "unblock" || (parsed.data.command === "respond" && parsed.data.status === "CANCELLED");
  const g = await guard({ verified: !cancelOrBlock });
  if (!g.ok) return { error: g.error };
  if (!rateLimit(`venture-collab:${g.user.id}`, 30, 5 * 60 * 1000).ok) return { error: "Trop de tentatives. Patiente quelques minutes." };
  try { await collaborate(db, g.user.id, parsed.data); }
  catch (e) { if (e instanceof VentureError) return { error: e.message }; throw e; }
  refresh(); return { success: "Enregistré dans ton espace Constellation." };
}
export async function reviewVentureAction(_: VentureState, form: FormData): Promise<VentureState> {
  const g = await guard({ permission: "content:validate", verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = z.object({ id: z.string().min(1).max(100), revision: z.coerce.number().int().min(1), status: z.enum(["PUBLISHED", "ARCHIVED"]), note: z.string().trim().max(500) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  if (parsed.data.status === "ARCHIVED" && parsed.data.note.length < 10) return { error: "Précise les ajustements nécessaires (10 caractères minimum)." };
  try { await reviewVenture(db, g.user, parsed.data); }
  catch (e) { if (e instanceof VentureError) return { error: e.message }; throw e; }
  refresh(); return { success: "Décision enregistrée." };
}
export async function archiveVentureAction(_: VentureState, form: FormData): Promise<VentureState> {
  const g = await guard(); if (!g.ok) return { error: g.error };
  const id = form.get("id"); if (typeof id !== "string" || id.length > 100) return { error: "Fiche invalide." };
  try { await archiveVenture(db, g.user.id, id); }
  catch (e) { if (e instanceof VentureError) return { error: e.message }; throw e; }
  refresh(); return { success: "Fiche retirée de la Constellation." };
}
