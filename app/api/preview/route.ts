import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  phrase: z.string().max(64),
});

const PREVIEW_COOKIE = "afrocodeurs-preview";
const INITIATE_PHRASE = "build before consume";

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  const phrase = parsed.success
    ? parsed.data.phrase.trim().toLowerCase().replace(/\s+/g, " ")
    : "";

  if (phrase !== INITIATE_PHRASE) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREVIEW_COOKIE, "open", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
