import { NextResponse } from "next/server";
import { VISITOR_COOKIE } from "@/lib/community-entry";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && new URL(origin).host !== (request.headers.get("host") || new URL(request.url).host))) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
  } catch { return NextResponse.json({ ok: false }, { status: 403 }); }
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  // A preference, not identity or permission to register.
  response.cookies.set(VISITOR_COOKIE, "1", { httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 90 });
  return response;
}
