"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { mentorshipSchema } from "./validators";
import { MentorshipError, runMentorship } from "./service";
import { rateLimit } from "@/lib/rate-limit";
export type MentorshipState = { error?: string; success?: boolean } | undefined;
export async function mentorshipAction(_: MentorshipState, form: FormData): Promise<MentorshipState> {
  const parsed = mentorshipSchema.safeParse({ ...Object.fromEntries(form), active: form.get("active") === "on" });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  const command = parsed.data;
  const verified = command.command === "offer" || command.command === "request" || (command.command === "respond" && command.status !== "CANCELLED");
  const g = await guard({ verified });
  if (!g.ok) return { error: g.error };
  if (!rateLimit(`mentorship:${g.user.id}`, 30, 5 * 60 * 1000).ok) return { error: "Trop de tentatives. Patiente quelques minutes." };
  try { await runMentorship(db, g.user.id, command); }
  catch (error) { if (error instanceof MentorshipError) return { error: error.message }; throw error; }
  revalidatePath("/mentorship"); revalidatePath("/mentorship/[id]", "page");
  revalidatePath("/dashboard/mentorship"); revalidatePath("/dashboard/notifications");
  return { success: true };
}
