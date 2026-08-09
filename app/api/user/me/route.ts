import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// session.accessToken no longer exists (tokens are confined to the httpOnly
// JWT cookie), so this route reads the token straight from the cookie — the
// same way the /api/backend proxy does.
function sessionCookieName(): string {
  const authUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? ''
  return authUrl.startsWith('https')
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'
}

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  const cookieName = sessionCookieName()
  const token = secret
    ? await getToken({ req, secret, salt: cookieName, cookieName })
    : null

  if (!token?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
