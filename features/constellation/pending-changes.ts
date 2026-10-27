import { ventureSchema } from "./validators";
import type { Prisma } from "@prisma/client";

// Revalidate JSON before using it as editable or published content.
export function pendingFields(value: Prisma.JsonValue | undefined | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parsed = ventureSchema.safeParse({ ...value, confirmed: "on", logoUrl: value.logoUrl ?? "", screenshots: Array.isArray(value.screenshots) ? value.screenshots.join("\n") : "", needs: Array.isArray(value.needs) ? value.needs.join(", ") : "", openSourceProjectId: value.openSourceProjectId ?? "" });
  if (!parsed.success) return null;
  const data = parsed.data;
  return { name: data.name, summary: data.summary, description: data.description, country: data.country, sector: data.sector, websiteUrl: data.websiteUrl, logoUrl: data.logoUrl || null, screenshots: data.screenshots, needs: data.needs, openSourceProjectId: data.openSourceProjectId || null };
}
