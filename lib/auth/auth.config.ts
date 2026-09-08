import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// This file's fetches run server-side (authorize() during login, and the
// jwt callback's refresh) — NEXT_PUBLIC_BASE_URL is the browser-facing
// origin and isn't reachable from inside the web container itself (see
// docker-compose.yml's comments on BACKEND_INTERNAL_URL vs
// NEXT_PUBLIC_BASE_URL). Same fallback chain app/api/backend/[...path]/route.ts
// already uses for the same reason.
const BACKEND_BASE =
  process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:8001/api/v1'

export const authConfig: NextAuthConfig = {
  trustHost: true, // Required if using environment variables for NEXTAUTH_URL behind a proxy

  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials) return null

        const { email, password } = credentials as { email: string; password: string }

        try {
          const response = await fetch(`${BACKEND_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email, password}),
          })

          if (!response.ok) {
            return null
          }

          const body = await response.json()

          return {
            id: email,
            email,
            accessToken: body.access_token,
            refreshToken: body.refresh_token,
            role: body.role,
            name: body.name,
          }

        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('AUTH ERROR in credentials.authorize:', error)
          }
          return null
        }
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.accessToken) {
        token.accessToken = session.accessToken
        if (session.refreshToken) {
          token.refreshToken = session.refreshToken
        }
        return token
      }

      // Persist role and tokens into JWT on first sign-in
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        // 55min, not 60: refresh before the backend's 60-minute expiry so a
        // token never goes out already dead (kept in sync with the
        // /api/backend proxy's ACCESS_TOKEN_LIFETIME_MS).
        token.accessTokenExpires = Date.now() + 55 * 60 * 1000
        token.role = user.role
        token.name = user.name
        token.user_id = user.id
        token.role_id = user.role_id
        token.instructor_profile_id = user.instructor_profile_id
        token.session_id = user.session_id
        return token
      }

      // Token still valid — nothing to refresh yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      try {
        const res = await fetch(`${BACKEND_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: token.refreshToken }),
        })
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`refresh failed: ${res.status} ${body}`)
        }
        const refreshed = await res.json()
        token.accessToken = refreshed.access_token
        token.refreshToken = refreshed.refresh_token
        token.accessTokenExpires = Date.now() + 55 * 60 * 1000
        delete token.error
      } catch (e) {
        console.error('[auth] token refresh failed:', e)
        token.error = 'RefreshAccessTokenError'
      }
      return token
    },

    async session({ session, token }) {
      if (token.error === 'RefreshAccessTokenError') {
        session.error = 'RefreshAccessTokenError';
      }
      // SECURITY: accessToken/refreshToken deliberately do NOT get copied
      // onto the session — the session object is readable by any client-side
      // JS (an XSS would exfiltrate the tokens). They stay inside the
      // encrypted httpOnly JWT cookie; the /api/backend proxy route decrypts
      // it server-side and injects the Authorization header there.
      session.name = token.name
      session.user_id = token.user_id
      session.session_id = token.session_id
      session.role = token.role
      session.instructor_profile_id = token.instructor_profile_id
      session.role_id = token.role_id

      return session
    },
  },

  events: {
    async signOut(message) {
      // Clearing the cookie alone would leave the backend tokens valid until
      // they expire — tell the backend to revoke them too.
      const token = 'token' in message ? message.token : null
      if (!token?.refreshToken) return
      try {
        await fetch(`${BACKEND_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token.accessToken ? { Authorization: `Bearer ${token.accessToken}` } : {}),
          },
          body: JSON.stringify({ refresh_token: token.refreshToken }),
        })
      } catch {
        // Best-effort — the tokens still die at their natural expiry.
      }
    },
  },

  pages: {
    signIn: '/login',
  },
}
