import { NextResponse } from "next/server";
import { z } from "zod";

import { advanceEarlyAccess, EARLY_ACCESS_SYMBOLS } from "@/lib/early-access";

const requestSchema = z.object({ symbol: z.enum(EARLY_ACCESS_SYMBOLS) });
const PREVIEW_COOKIE = "afrocodeurs-preview";
const RIDDLE_COOKIE = "afrocodeurs-riddle";

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const riddleToken = cookieHeader
      .split(";")
      .map((part) => part.trim().split("="))
      .find(([name]) => name === RIDDLE_COOKIE)?.[1];
    const result = advanceEarlyAccess(parsed.data.symbol, riddleToken);
    const response = NextResponse.json({
      ok: result.status === "unlocked",
      status: result.status,
      progress: result.progress,
    });

    if (result.token) {
      response.cookies.set(RIDDLE_COOKIE, result.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/api/preview",
        maxAge: 60 * 60,
      });
    }

    if (result.status === "unlocked") {
      response.cookies.set(PREVIEW_COOKIE, "open", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set(RIDDLE_COOKIE, "", { path: "/api/preview", maxAge: 0 });
    }

    return response;
  } catch (error) {
    console.error("[early-access] configuration invalide", error);
    return NextResponse.json({ ok: false, status: "unavailable" }, { status: 503 });
  }
}
