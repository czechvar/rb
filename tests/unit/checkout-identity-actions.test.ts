import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  verify: vi.fn(),
  accept: vi.fn(),
  currentUser: vi.fn(),
  login: vi.fn(),
  setCookie: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ set: mocks.setCookie }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/contact/intake', () => ({ contactNetwork: () => 'test-network' }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.currentUser }))
vi.mock('@/lib/payload', () => ({ getPayloadClient: async () => ({ login: mocks.login }) }))
vi.mock('@/lib/checkout/identity', () => ({
  acceptCheckoutInvitation: mocks.accept,
  createGuestCheckout: mocks.create,
  invitationKind: vi.fn(),
  lookupCheckoutJourney: vi.fn(),
  reviewGuestCheckout: vi.fn(),
  verifyGuestCheckout: mocks.verify,
}))

import {
  acceptCheckoutInvitationAction,
  createGuestCheckoutAction,
  verifyGuestCheckoutAction,
} from '@/app/(frontend)/checkout/identity-actions'

describe('guest checkout identity actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('logs a new invited customer in and sends them directly to checkout payment', async () => {
    mocks.currentUser.mockResolvedValue(null)
    mocks.accept.mockResolvedValue({ created: true, email: 'ada@example.test' })
    mocks.login.mockResolvedValue({ token: 'fixture-session-token' })
    const data = new FormData()
    data.set('checkout', '27')
    data.set('token', 'a'.repeat(43))
    data.set('name', 'Ada Lovelace')
    data.set('password', 'FixturePassword42!')
    data.set('passwordConfirm', 'FixturePassword42!')

    await expect(acceptCheckoutInvitationAction(null, data)).resolves.toEqual({
      ok: true,
      redirect: '/account/checkouts/27#payment',
    })
    expect(mocks.accept).toHaveBeenCalledWith(
      27,
      'a'.repeat(43),
      { name: 'Ada Lovelace', password: 'FixturePassword42!' },
      null,
      'test-network',
    )
    expect(mocks.login).toHaveBeenCalledWith({
      collection: 'users',
      data: { email: 'ada@example.test', password: 'FixturePassword42!' },
    })
    expect(mocks.setCookie).toHaveBeenCalledWith(
      'payload-token',
      'fixture-session-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    )
  })

  it('falls back to login with the payment destination when session creation fails', async () => {
    mocks.currentUser.mockResolvedValue(null)
    mocks.accept.mockResolvedValue({ created: true, email: 'ada@example.test' })
    mocks.login.mockRejectedValue(new Error('fixture login failure'))
    const data = new FormData()
    data.set('checkout', '27')
    data.set('token', 'a'.repeat(43))
    data.set('name', 'Ada Lovelace')
    data.set('password', 'FixturePassword42!')
    data.set('passwordConfirm', 'FixturePassword42!')

    await expect(acceptCheckoutInvitationAction(null, data)).resolves.toEqual({
      ok: true,
      redirect: '/login?from=%2Faccount%2Fcheckouts%2F27%23payment',
    })
    expect(mocks.setCookie).not.toHaveBeenCalled()
  })

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
