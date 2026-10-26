import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PREVIEW_COOKIE = "afrocodeurs-preview";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const previewEnabled = request.cookies.get(PREVIEW_COOKIE)?.value === "open";

  if (pathname === "/construction") {
    return previewEnabled
      ? NextResponse.redirect(new URL("/register", request.url))
      : NextResponse.next();
  }
  // The puzzle is an onboarding step, not authentication for public content.
  if ((pathname === "/register" || pathname.startsWith("/register/")) && !previewEnabled) {
    return NextResponse.redirect(new URL("/construction", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/register/:path*", "/construction"],
};
