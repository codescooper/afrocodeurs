"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export type NewsletterFormState =
  | { error?: string; success?: string }
  | undefined;

export async function addNewsletterSubscriberAction(
  _previous: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const access = await guard({ permission: "newsletter:manage" });
  if (!access.ok) return { error: access.error };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Adresse e-mail invalide." };

  try {
    await db.newsletterSubscriber.create({
      data: { email: parsed.data, source: "admin" },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Cette adresse est déjà inscrite." };
    }
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/newsletter");
  return { success: "Adresse ajoutée à la newsletter." };
}

export async function deleteNewsletterSubscriberAction(
  formData: FormData,
): Promise<void> {
  const access = await guard({ permission: "newsletter:manage" });
  if (!access.ok) return;

  const id = formData.get("id");
  if (typeof id !== "string" || id.length > 64) return;

  await db.newsletterSubscriber.deleteMany({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/newsletter");
}
