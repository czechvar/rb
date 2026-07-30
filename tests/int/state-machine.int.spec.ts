import { describe, expect, it } from 'vitest'
import {
  ORDER_STATES,
  isTerminalState,
  isTransitionAllowed,
  type OrderState,
} from '@/collections/orders/state-machine'

describe('state machine — ORDER_STATES', () => {
  it('contains the five states in order', () => {
    expect(ORDER_STATES).toEqual(['pending', 'confirmed', 'paid', 'completed', 'cancelled'])
  })
})

describe('isTerminalState', () => {
  it('marks completed and cancelled terminal', () => {
    expect(isTerminalState('completed')).toBe(true)
    expect(isTerminalState('cancelled')).toBe(true)
  })
  it('marks pending/confirmed/paid non-terminal', () => {
    expect(isTerminalState('pending')).toBe(false)
    expect(isTerminalState('confirmed')).toBe(false)
    expect(isTerminalState('paid')).toBe(false)
  })
})

describe('isTransitionAllowed', () => {
  const allowed: Array<[OrderState, OrderState]> = [
    ['pending', 'confirmed'],
    ['pending', 'cancelled'],
    ['confirmed', 'paid'],
    ['confirmed', 'cancelled'],
    ['paid', 'completed'],
    ['paid', 'cancelled'],
  ]
  it.each(allowed)('allows %s -> %s', (from, to) => {
    expect(isTransitionAllowed(from, to)).toBe(true)
  })
  it('treats same-state transitions as allowed (no-op save)', () => {
    for (const s of ORDER_STATES) expect(isTransitionAllowed(s, s)).toBe(true)
  })
  it('rejects forward skipping', () => {
    expect(isTransitionAllowed('pending', 'paid')).toBe(false)
    expect(isTransitionAllowed('pending', 'completed')).toBe(false)
    expect(isTransitionAllowed('confirmed', 'completed')).toBe(false)
  })
  it('rejects any transition from a terminal state', () => {
    for (const target of ORDER_STATES) {
      if (target === 'completed') continue
      expect(isTransitionAllowed('completed', target)).toBe(false)
    }
    for (const target of ORDER_STATES) {
      if (target === 'cancelled') continue
      expect(isTransitionAllowed('cancelled', target)).toBe(false)
    }
  })
  it('rejects backwards transitions', () => {
    expect(isTransitionAllowed('confirmed', 'pending')).toBe(false)
    expect(isTransitionAllowed('paid', 'confirmed')).toBe(false)
  })
})
