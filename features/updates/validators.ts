import { z } from "zod";

export const platformUpdateSchema = z.object({
  version: z.string().trim().min(2).max(40),
  title: z.string().trim().min(5).max(140),
  summary: z.string().trim().min(10).max(320),
  content: z.string().trim().min(20).max(20_000),
  category: z.string().trim().min(2).max(40),
  requestedBy: z.string().trim().max(160).optional(),
  sourceUrl: z.string().trim().startsWith("/").max(500).optional(),
});
