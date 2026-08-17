import { z } from "zod";
import { EVENT_FORMATS, EVENT_TYPES } from "./constants";

export const eventSchema = z.object({
  title: z.string().trim().min(5).max(160), summary: z.string().trim().min(20).max(320), description: z.string().trim().min(40).max(12000),
  type: z.enum(EVENT_TYPES), format: z.enum(EVENT_FORMATS), startsAt: z.coerce.date(), endsAt: z.coerce.date(), timezone: z.string().trim().min(2).max(80),
  capacity: z.coerce.number().int().positive().max(100000).optional(), platform: z.string().trim().max(80).optional(), accessUrl: z.url().optional().or(z.literal("")),
  venue: z.string().trim().max(160).optional(), city: z.string().trim().max(100).optional(), country: z.string().trim().max(100).optional(), communityId: z.string().optional().or(z.literal("")),
}).superRefine((d, ctx) => {
  if (d.endsAt <= d.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "La fin doit suivre le début." });
  if (d.format !== "IN_PERSON" && !d.accessUrl) ctx.addIssue({ code: "custom", path: ["accessUrl"], message: "Le lien du direct est requis." });
  if (d.format !== "ONLINE" && !d.venue) ctx.addIssue({ code: "custom", path: ["venue"], message: "Le lieu est requis." });
});
