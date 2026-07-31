import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PREVIEW_COOKIE = "afrocodeurs-preview";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const previewEnabled = request.cookies.get(PREVIEW_COOKIE)?.value === "open";

  if (pathname === "/construction") {
    return previewEnabled
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!previewEnabled) {
    return NextResponse.redirect(new URL("/construction", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|robots.txt|sitemap.xml|sw.js|pow-worker.js|ancestral-pixel-loop.mp3).*)",
  ],
};
