import { headers as nextHeaders } from 'next/headers'
import { getPayloadClient } from './payload'
import type { User } from '../payload-types'

/**
 * Returns the currently logged-in user (or null) by reading the
 * payload-token cookie via Next.js request headers and asking Payload
 * to verify + look up the user. Use from Server Components or Server
 * Actions only — never from Client Components.
 */
export async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const h = await nextHeaders()
  const { user } = await payload.auth({ headers: h as unknown as Headers })
  return (user as User | null) ?? null
}

/**
 * Returns the user or throws — for routes that must be authenticated.
 * Middleware will normally have redirected to /login before this fires.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  return user
}
