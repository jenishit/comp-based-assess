import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPrefixes = ["/dashboard", "/test"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthPage = pathname.startsWith("/api/auth");
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (isStatic || isAuthPage) {
    return NextResponse.next();
  }

  if (isProtected) {
    const sessionCookie =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("modal", "instructor");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
