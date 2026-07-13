import { handlers } from '@/lib/auth/auth'

export async function GET(...args: Parameters<typeof handlers.GET>) {
  console.info('[next-auth] GET /api/auth/[...nextauth]')
  return handlers.GET(...args)
}

export async function POST(...args: Parameters<typeof handlers.POST>) {
  console.info('[next-auth] POST /api/auth/[...nextauth]')
  return handlers.POST(...args)
}
