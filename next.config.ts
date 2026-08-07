import type { NextConfig } from "next";

// Backend origin (scheme://host:port), derived from the API base URL so CSP
// connect-src and the rewrites stay in sync with the environment.
const apiBase = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8001/api/v1";
const backendOrigin = new URL(apiBase).origin;
const backendWsOrigin = backendOrigin.replace(/^http/, "ws");
// MinIO/S3 — presigned uploads (PDF) and evidence-snapshot image URLs.
const storageOrigin = process.env.NEXT_PUBLIC_STORAGE_ORIGIN ?? "http://localhost:9000";

const isDev = process.env.NODE_ENV === "development";

// Static CSP (no nonces): nonces would force dynamic rendering everywhere,
// and this app needs 'unsafe-inline'/'wasm-unsafe-eval' anyway for MediaPipe
// WASM + Next's inline runtime. The important protections here are
// frame-ancestors (clickjacking an exam page), restricting connect-src to
// known origins, and blocking object/base-uri injection vectors.
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is required by React's dev-mode error overlay only.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://cdn.jsdelivr.net`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${storageOrigin}`,
  "media-src 'self' blob:",
  "font-src 'self' data:",
  // Backend API + WS, MediaPipe WASM/model CDNs, MinIO presigned uploads.
  `connect-src 'self' ${backendOrigin} ${backendWsOrigin} ${storageOrigin} https://cdn.jsdelivr.net https://storage.googleapis.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const storageUrl = new URL(storageOrigin);

const nextConfig: NextConfig = {
  images: {
    // Evidence snapshots are served from MinIO/S3 via presigned URLs. They're
    // rendered with `unoptimized`, but the host must still be allow-listed.
    remotePatterns: [
      {
        protocol: storageUrl.protocol.replace(":", "") as "http" | "https",
        hostname: storageUrl.hostname,
        port: storageUrl.port || undefined,
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // frame-ancestors supersedes X-Frame-Options, but keep both for
          // older browsers/scanners.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Camera + mic are required by proctoring on this origin; deny the
          // rest, and deny everything to embedded third parties.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
        ],
      },
    ];
  },
  async rewrites() {
    // Kept for the capability-based (attempt_id) exam-taking endpoints and
    // sendBeacon flushes, which carry no Authorization header. Authenticated
    // teacher/student API traffic goes through /api/backend/* instead (see
    // app/api/backend/[...path]/route.ts), which injects the token
    // server-side so it never has to exist in client-readable JS.
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      {
        source: "/api/exam/:path*",
        destination: `${backendOrigin}/api/v1/exam/:path*`,
      },
    ];
  },
};

export default nextConfig;
