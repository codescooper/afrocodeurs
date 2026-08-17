"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
const schema = z.object({ kind: z.enum(["SALARY", "FREELANCE", "CONTRACT"]), role: z.string().trim().min(2).max(100), country: z.string().trim().min(2).max(100), experienceYears: z.coerce.number().int().min(0).max(60), amountMin: z.coerce.number().int().positive(), amountMax: z.coerce.number().int().positive(), currency: z.string().trim().length(3).transform(x => x.toUpperCase()), period: z.enum(["MONTH", "YEAR", "DAY", "HOUR", "PROJECT"]), remote: z.string().optional(), clientType: z.string().trim().max(80).optional(), technologies: z.string().max(500).optional() }).refine(d => d.amountMax >= d.amountMin, { message: "Le maximum doit être supérieur ou égal au minimum." });
export type CompensationState = { error?: string } | undefined;
export async function createCompensationReportAction(_: CompensationState, formData: FormData): Promise<CompensationState> { const g = await guard({ verified: true }); if (!g.ok) return { error: g.error }; const parsed = schema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: invalidMessage(parsed.error) }; const d = parsed.data; await db.compensationReport.create({ data: { kind: d.kind, role: d.role, country: d.country, experienceYears: d.experienceYears, amountMin: d.amountMin, amountMax: d.amountMax, currency: d.currency, period: d.period, remote: d.remote === "true", clientType: d.clientType || null, technologies: d.technologies?.split(",").map(x => x.trim()).filter(Boolean).slice(0, 12) ?? [] } }); revalidatePath("/compensation"); redirect("/compensation?merci=1"); }
