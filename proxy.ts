import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

// /test is excluded: the exam-taking page authenticates via the attempt_id
// capability returned from the anonymous POST /exams/join, not a NextAuth
// session — students taking an exam never log in.
const protectedPrefixes = ['/instructor', '/student', '/dashboard']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('modal', 'instructor')
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|favicon.ico).*)'],
}
