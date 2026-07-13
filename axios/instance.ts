import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

const axiosInstance = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 10000,
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// The bearer token, resolved lazily from the NextAuth session. Cached as a
// single in-flight promise so concurrent requests share one /api/auth/session
// lookup instead of each firing their own. Invalidated by refreshAuthToken() on
// every auth transition (sign-in, sign-out, expiry).
let tokenPromise: Promise<string | undefined> | null = null

function resolveToken(): Promise<string | undefined> {
  if (!tokenPromise) {
    tokenPromise = getSession().then((session) => session?.accessToken)
  }
  return tokenPromise
}

// Drop the cached token so the next request re-reads the session. Call after any
// auth transition so a stale (or stale-anonymous) token is never reused.
export function refreshAuthToken(): void {
  tokenPromise = null
}

// Attach the token at request time. Resolving it per-request from the session —
// rather than mutating a shared default header from a React effect — means every
// call is correctly authenticated regardless of component mount/effect ordering.
// Because the interceptor awaits the token, a request fired before the session
// has resolved simply waits for it instead of racing out with no header.
axiosInstance.interceptors.request.use(async (config) => {
  const token = await resolveToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isSigningOut = false

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    // Only force a sign-out when the failed request actually carried a token —
    // i.e. a logged-in session expired or was revoked. A 401 on an anonymous
    // request (a public marketplace page hitting an auth-gated endpoint) is
    // expected and must NOT bounce the visitor to /signin; the caller handles it.
    const hadToken = Boolean(error.config?.headers?.Authorization)
    if (error.response?.status === 401 && hadToken && !isSigningOut) {
      isSigningOut = true

      refreshAuthToken()

      await signOut({
        callbackUrl: '/signin',
      })
    }

    return Promise.reject(error)
  },
)

export default axiosInstance