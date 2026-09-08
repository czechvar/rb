import type { Access, PayloadRequest } from 'payload'

type RoleBearingUser = {
  id: unknown
  role?: unknown
}

export const isAdminUser = (user: unknown): user is RoleBearingUser & { role: 'admin' } =>
  typeof user === 'object' && user !== null && 'role' in user && user.role === 'admin'

/** Public — anyone can perform the operation. */
export const anyone: Access = () => true

/** Only authenticated admin users. */
export const isAdmin: Access = ({ req }) => isAdminUser(req.user)

/** Admins, or the user acting on their own document. */
export const isAdminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (isAdminUser(req.user)) return true
  if (!('role' in req.user)) return false
  return { id: { equals: req.user.id } }
}

/**
 * Entry to the admin panel, for the collection `payload.config.ts` names as
 * `admin.user`. Payload types this more narrowly than `Access` — it must
 * resolve to a boolean and may not return a `Where` filter — so it cannot
 * simply reuse `isAdmin`.
 */
export const canAccessAdminPanel = ({ req }: { req: PayloadRequest }): boolean =>
  isAdminUser(req.user)

/** Any authenticated user, customer or admin. */
export const isAuthenticated: Access = ({ req }) => Boolean(req.user)
