import { NextRequest, NextResponse } from "next/server";
import { encode, getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

/**
 * Authenticated API proxy.
 *
 * The backend access/refresh tokens live only inside the encrypted, httpOnly
 * NextAuth session cookie — client-side JS never sees them (XSS can't
 * exfiltrate what the page can't read). Every authenticated API call goes
 * through this route, which decrypts the cookie server-side, injects the
 * Authorization header, and forwards to FastAPI.
 *
 * This route is also a refresh point: if the access token is past its expiry
 * it refreshes against the backend *before* forwarding, and persists the
 * rotated token pair by re-encoding the session cookie on the response —
 * something the NextAuth jwt callback can't do from inside a route handler.
 */

const BACKEND_BASE =
  process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8001/api/v1";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
// Refresh 5 minutes before the backend's 60-minute expiry so a token never
// goes out already dead.
const ACCESS_TOKEN_LIFETIME_MS = 55 * 60 * 1000;

function sessionCookieName(): string {
  const authUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "";
  return authUrl.startsWith("https")
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

async function refreshTokens(token: JWT): Promise<JWT | null> {
  try {
    const res = await fetch(`${BACKEND_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
    };
  } catch {
    return null;
  }
}

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const cookieName = sessionCookieName();

  let token: JWT | null = null;
  if (secret) {
    token = await getToken({ req, secret, salt: cookieName, cookieName });
  }

  let refreshedCookie: string | null = null;
  if (
    secret &&
    token?.refreshToken &&
    typeof token.accessTokenExpires === "number" &&
    Date.now() >= token.accessTokenExpires
  ) {
    const refreshed = await refreshTokens(token);
    if (refreshed) {
      token = refreshed;
      refreshedCookie = await encode({
        token,
        secret,
        salt: cookieName,
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    }
    // On refresh failure we still forward with the stale token: the backend's
    // 401 then reaches the client, whose interceptor signs the user out.
  }

  const targetUrl = `${BACKEND_BASE}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", req.headers.get("accept") ?? "application/json");
  // Preserve the real client IP for the backend's per-IP rate limiting when
  // a reverse proxy in front of Next set it; without it all proxied traffic
  // would share one bucket.
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  if (token?.accessToken) headers.set("authorization", `Bearer ${token.accessToken}`);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  const responseType = backendResponse.headers.get("content-type");
  if (responseType) responseHeaders.set("content-type", responseType);
  const retryAfter = backendResponse.headers.get("retry-after");
  if (retryAfter) responseHeaders.set("retry-after", retryAfter);

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  if (refreshedCookie) {
    response.cookies.set(cookieName, refreshedCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: cookieName.startsWith("__Secure-"),
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
