
import { loginSchema } from '@/schemas/login-schema'
import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const backendBaseUrl =
  process.env.BACKEND_BASE_URL ?? 'http://backend:8000/api/v1'

export const authConfig: NextAuthConfig = {
  trustHost: true, // Required if using environment variables for NEXTAUTH_URL behind a proxy

  secret: process.env.AUTH_SECRET,

  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        console.info('[next-auth] authorize() called', {
          backendBaseUrl,
          hasEmail: Boolean(credentials?.email),
        })

        const parsed = loginSchema.safeParse(credentials)

        if (!parsed.success) {
          console.warn('[next-auth] credential validation failed', {
            issues: parsed.error.issues,
          })
          return null
        }

        try {
          const response = await fetch(`${backendBaseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
            cache: 'no-store',
          })

          if (!response.ok) {
            console.warn('[next-auth] backend rejected login', {
              status: response.status,
            })
            return null
          }

          const responseText = await response.text()

          console.info('[next-auth] backend auth response', {
            status: response.status,
            ok: response.ok,
          })

          let result: { access_token: string; token_type: string; role: string; name: string }

          try {
            result = JSON.parse(responseText)
          } catch (error) {
            console.error('[next-auth] backend response was not valid JSON', {
              error,
              responseText: responseText.slice(0, 500),
            })
            return null
          }

          const payload = JSON.parse(
            Buffer.from(result.access_token.split('.')[1], 'base64url').toString('utf-8'),
          )

          console.info('[next-auth] login succeeded', {
            userId: payload.sub,
            userType: result.role,
          })

          return {
            id: payload.sub,
            email: parsed.data.email,
            accessToken: result.access_token,
            userType: result.role,
            sessionId: payload.sub,
          }
        } catch (error) {
          console.error('[next-auth] authorize() failed', {
            error,
          })
          return null
        }
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, user }) {
      console.info('[next-auth] jwt callback', {
        hasUser: Boolean(user),
        tokenUserType: token.userType,
      })

      if (user) {
        token.accessToken = user.accessToken
        token.sessionId = user.sessionId
        token.userType = user.userType
      }
      return token
    },

    async session({ session, token }) {
      console.info('[next-auth] session callback', {
        hasAccessToken: Boolean(token.accessToken),
        tenantId: token.tenantId,
        userType: token.userType,
      })

      session.accessToken = token.accessToken as string
      session.sessionId = token.sessionId as string
      session.userType = token.userType as string
      return session
    },
  },

  pages: {
    signIn: '/signin',
  },
}
