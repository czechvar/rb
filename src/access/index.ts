import type { Access } from 'payload'

/** Public — anyone can perform the operation. */
export const anyone: Access = () => true

/** Only authenticated admin users. */
export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

/** Admins, or the user acting on their own document. */
export const isAdminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return { id: { equals: req.user.id } }
}
