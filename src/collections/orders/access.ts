import type { Access, FieldAccess } from 'payload'

/** Admin sees all; non-admin sees only own orders (where: user = self). */
export const isAdminOrOwner: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return { user: { equals: req.user.id } }
}

/**
 * Field-level update access on `state`. Combined with the collection-level
 * isAdminOrOwner (owner scoping), this restricts non-admins to one transition:
 * pending -> cancelled on their own orders.
 *
 * Admin: unrestricted (the state-transition hook still validates the matrix).
 * Non-admin: only when the new value is 'cancelled' AND the current doc state
 *            is 'pending'. Everything else rejected.
 */
export const canUpdateStateField: FieldAccess = ({ req, data, doc }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  const newState = (data as { state?: string } | undefined)?.state
  const currentState = (doc as { state?: string } | undefined)?.state
  return newState === 'cancelled' && currentState === 'pending'
}
