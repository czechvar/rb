import { describe, expect, it } from 'vitest'
import { isAuthenticated } from '@/access'
import { isAdminOrOwner, canUpdateStateField } from '@/collections/orders/access'
import type { User } from '@/payload-types'

const customer = { id: 1, email: 'c@example.com', role: 'customer' } as unknown as User
const admin = { id: 2, email: 'a@example.com', role: 'admin' } as unknown as User

function req(user: User | null) {
  return { user } as unknown as Parameters<typeof isAuthenticated>[0]['req']
}

describe('isAuthenticated', () => {
  it('returns false when there is no user', () => {
    expect(isAuthenticated({ req: req(null) } as never)).toBe(false)
  })
  it('returns true for any authenticated user', () => {
    expect(isAuthenticated({ req: req(customer) } as never)).toBe(true)
    expect(isAuthenticated({ req: req(admin) } as never)).toBe(true)
  })
})

describe('isAdminOrOwner', () => {
  it('returns false when there is no user', () => {
    expect(isAdminOrOwner({ req: req(null) } as never)).toBe(false)
  })
  it('returns true for admin', () => {
    expect(isAdminOrOwner({ req: req(admin) } as never)).toBe(true)
  })
  it('returns a where filter for non-admin', () => {
    expect(isAdminOrOwner({ req: req(customer) } as never)).toEqual({
      user: { equals: customer.id },
    })
  })
})

describe('canUpdateStateField', () => {
  function args(user: User | null, data: { state?: string } | undefined, doc: { state?: string }) {
    return { req: req(user), data, doc, siblingData: data } as never
  }
  it('returns false with no user', () => {
    expect(canUpdateStateField(args(null, { state: 'cancelled' }, { state: 'pending' }))).toBe(false)
  })
  it('returns true for admin always', () => {
    expect(canUpdateStateField(args(admin, { state: 'paid' }, { state: 'confirmed' }))).toBe(true)
    expect(canUpdateStateField(args(admin, { state: 'completed' }, { state: 'paid' }))).toBe(true)
  })
  it('allows non-admin to cancel a pending order', () => {
    expect(canUpdateStateField(args(customer, { state: 'cancelled' }, { state: 'pending' }))).toBe(true)
  })
  it('rejects non-admin trying to advance state', () => {
    expect(canUpdateStateField(args(customer, { state: 'confirmed' }, { state: 'pending' }))).toBe(false)
    expect(canUpdateStateField(args(customer, { state: 'paid' }, { state: 'pending' }))).toBe(false)
  })
  it('rejects non-admin trying to cancel a non-pending order', () => {
    expect(canUpdateStateField(args(customer, { state: 'cancelled' }, { state: 'confirmed' }))).toBe(false)
    expect(canUpdateStateField(args(customer, { state: 'cancelled' }, { state: 'paid' }))).toBe(false)
  })
})
