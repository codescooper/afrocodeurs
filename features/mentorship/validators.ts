import { z } from "zod";
const tags = z.string().max(240).transform((value) => [...new Set(value.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))])
  .pipe(z.array(z.string().min(2).max(40)).min(1).max(6));
const id = z.string().min(1).max(100);
export const mentorshipSchema = z.discriminatedUnion("command", [
  z.object({ command: z.literal("offer"), title: z.string().trim().min(5).max(100), description: z.string().trim().min(40).max(2000), topics: tags, languages: tags, availability: z.string().trim().min(5).max(160), capacity: z.coerce.number().int().min(1).max(5), active: z.boolean() }),
  z.object({ command: z.literal("request"), id, message: z.string().trim().min(40).max(2000) }),
  z.object({ command: z.literal("respond"), id, status: z.enum(["ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"]) }),
  z.object({ command: z.literal("block"), id }), z.object({ command: z.literal("unblock"), id }),
]);
export type MentorshipCommand = z.infer<typeof mentorshipSchema>;
export const STATUS_LABELS = { PENDING: "En attente", ACCEPTED: "En cours", DECLINED: "Refusée", CANCELLED: "Annulée", COMPLETED: "Terminée" };
export function canTransition(current: string, next: string, isMentor: boolean): boolean {
  if (next === "CANCELLED") return current === "PENDING" || current === "ACCEPTED";
  if (!isMentor) return false;
  return (current === "PENDING" && ["ACCEPTED", "DECLINED"].includes(next)) || (current === "ACCEPTED" && next === "COMPLETED");
}
