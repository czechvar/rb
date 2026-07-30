export const ORDER_STATES = ['pending', 'confirmed', 'paid', 'completed', 'cancelled'] as const
export type OrderState = (typeof ORDER_STATES)[number]

const TERMINAL: ReadonlySet<OrderState> = new Set(['completed', 'cancelled'])

export function isTerminalState(s: OrderState): boolean {
  return TERMINAL.has(s)
}

const FORWARD: Record<OrderState, OrderState | null> = {
  pending: 'confirmed',
  confirmed: 'paid',
  paid: 'completed',
  completed: null,
  cancelled: null,
}

export function isTransitionAllowed(from: OrderState, to: OrderState): boolean {
  if (from === to) return true
  if (TERMINAL.has(from)) return false
  if (to === 'cancelled') return true
  return FORWARD[from] === to
}
