import type { CollectionBeforeChangeHook } from 'payload'
import { isTransitionAllowed, type OrderState } from './state-machine'

/**
 * Validate the state transition on update. The matrix is enforced in the pure
 * validator; this hook just guards the persisted edge.
 */
export const validateStateTransition: CollectionBeforeChangeHook = ({
  data, originalDoc, operation,
}) => {
  if (operation !== 'update' || !data) return data
  const next = (data as { state?: OrderState }).state
  const prev = (originalDoc as { state?: OrderState } | undefined)?.state
  if (!next || !prev || next === prev) return data
  if (!isTransitionAllowed(prev, next)) {
    throw new Error(`Invalid order state transition: ${prev} -> ${next}`)
  }
  return data
}
