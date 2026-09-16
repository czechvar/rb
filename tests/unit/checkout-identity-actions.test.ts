import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  verify: vi.fn(),
}))

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/contact/intake', () => ({ contactNetwork: () => 'test-network' }))
vi.mock('@/lib/checkout/identity', () => ({
  acceptCheckoutInvitation: vi.fn(),
  createGuestCheckout: mocks.create,
  invitationKind: vi.fn(),
  lookupCheckoutJourney: vi.fn(),
  reviewGuestCheckout: vi.fn(),
  verifyGuestCheckout: mocks.verify,
}))

import {
  createGuestCheckoutAction,
  verifyGuestCheckoutAction,
} from '@/app/(frontend)/checkout/identity-actions'

describe('guest checkout identity actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps a newly created guest checkout inline and returns only its identifier', async () => {
    mocks.create.mockResolvedValue(27)
    const data = new FormData()
    data.set('submissionKey', 'ecd1649c-42ca-47a9-99f6-b3f20d5a59f3')
    data.set('name', 'Fixture')
    data.set('email', 'fixture@example.test')
    data.set('phone', '+420123456789')
    data.set('items', JSON.stringify([{ eventDateId: 1, quantity: 1 }]))

    await expect(createGuestCheckoutAction(null, data)).resolves.toEqual({
      ok: true,
      checkoutId: 27,
    })
  })

  it('verifies a guest checkout with its six-digit code', async () => {
    const data = new FormData()
    data.set('checkout', '27')
    data.set('code', '000042')

    await expect(verifyGuestCheckoutAction(null, data)).resolves.toEqual({ ok: true })
    expect(mocks.verify).toHaveBeenCalledWith(27, '000042', 'test-network')
  })

  it('accepts an already-issued link token during the compatibility window', async () => {
    const data = new FormData()
    data.set('checkout', '27')
    data.set('token', 'a'.repeat(43))

    await expect(verifyGuestCheckoutAction(null, data)).resolves.toEqual({ ok: true })
    expect(mocks.verify).toHaveBeenCalledWith(27, 'a'.repeat(43), 'test-network')
  })
})
