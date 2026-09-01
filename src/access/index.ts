import type { Access } from 'payload'

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

/** Any authenticated user, customer or admin. */
export const isAuthenticated: Access = ({ req }) => Boolean(req.user)
