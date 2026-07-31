import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
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
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000
        token.role = user.role
        token.name = user.name
        token.user_id = user.id
        token.role_id = user.role_id
        token.instructor_profile_id = user.instructor_profile_id
        token.session_id = user.session_id
        return token
      }

      // Refresh the access token before it expires
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/refresh`, {
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
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000
        delete token.error
      } catch (e) {
        console.error('[auth] token refresh failed:', e)
        token.error = 'RefreshAccessTokenError'
      }
      return token
    },

    async session({ session, token }) {
      // Surface the refresh error, but keep attaching the last-known token below
      // regardless — dropping it here would send subsequent requests out with no
      // Authorization header at all (a bare, confusing 401) instead of the last
      // (now-invalid) token, which yields a real backend-validated 401 and lets
      // the axios interceptor's single sign-out path handle it.
      if (token.error === 'RefreshAccessTokenError') {
        session.error = 'RefreshAccessTokenError';
      }
      // Attach accessToken and user_id
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.name = token.name
      session.user_id = token.user_id
      session.session_id = token.session_id
      session.role = token.role
      session.instructor_profile_id = token.instructor_profile_id
      session.role_id = token.role_id

      return session
    },
  },

  pages: {
    signIn: '/login',
  },
}
