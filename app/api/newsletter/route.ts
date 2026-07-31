import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ ok: false, message: "Adresse e-mail invalide." }, { status: 400 });
  }

  try {
    await db.newsletterSubscriber.create({ data: { email: parsed.data.email } });
    return Response.json({ ok: true, message: "Inscription confirmée. À très vite !" }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ ok: true, message: "Cette adresse est déjà inscrite." });
    }
    console.error("[newsletter] inscription impossible", error);
    return Response.json({ ok: false, message: "Impossible de s’inscrire pour le moment." }, { status: 500 });
  }
}
