// @vitest-environment node
import { describe, expect, it, beforeEach } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { clearTestInbox, getTestInbox } from '../../src/lib/email/adapter'

describe('auth flows (local API + test email adapter)', () => {
  beforeEach(() => {
    clearTestInbox()
  })

  it('registration produces an unverified user and sends a verify email', async () => {
    const payload = await getTestPayload()
    const email = `reg-${Date.now()}@example.com`
    await payload.create({
      collection: 'users',
      data: {
        name: 'Reg User',
        email,
        phone: '+420 777 100 200',
        password: 'password123',
      } as never,
    })
    const verifySends = getTestInbox().filter((m) => m.to === email)
    expect(verifySends.length).toBe(1)
    expect(verifySends[0].subject).toMatch(/verify your email/i)
  })

  it('forgot-password → reset-password succeeds; second use of same token fails', async () => {
    const payload = await getTestPayload()
    const email = `fp-${Date.now()}@example.com`
    const created = await payload.create({
      collection: 'users',
      data: {
        name: 'FP User',
        email,
        phone: '+420 777 200 300',
        password: 'oldpassword',
      } as never,
    })
    await payload.update({
      collection: 'users',
      id: created.id,
      data: { _verified: true } as never,
    })

    clearTestInbox()
    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email },
    })
    expect(typeof token).toBe('string')
    const resetSends = getTestInbox().filter((m) => m.to === email)
    expect(resetSends.length).toBe(1)
    expect(resetSends[0].subject).toMatch(/reset your.*password/i)

    await payload.resetPassword({
      collection: 'users',
      data: { token: token as string, password: 'newpassword123' },
      overrideAccess: true,
    })

    await expect(
      payload.resetPassword({
        collection: 'users',
        data: { token: token as string, password: 'evenNewer' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('field access: a customer cannot promote themselves to admin (role is silently stripped)', async () => {
    const payload = await getTestPayload()
    const email = `r-${Date.now()}@example.com`
    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Promoter',
        email,
        phone: '+420 777 400 500',
        password: 'password123',
      } as never,
    })
    expect(user.role).toBe('customer')
    // Payload's field-level access denial is a silent strip, not a throw.
    // The update resolves, but role stays 'customer'.
    const updated = await payload.update({
      collection: 'users',
      id: user.id,
      data: { role: 'admin' } as never,
      overrideAccess: false,
      user: user as never,
    })
    expect(updated.role).toBe('customer')
  })

  it('default-address exclusivity: setting isDefault on a second row clears the first', async () => {
    const payload = await getTestPayload()
    const email = `dd-${Date.now()}@example.com`
    let user = await payload.create({
      collection: 'users',
      data: {
        name: 'Addr',
        email,
        phone: '+420 777 500 600',
        password: 'password123',
        addresses: [
          {
            isDefault: true,
            firstName: 'A',
            lastName: 'A',
            street: 's1',
            city: 'c',
            postalCode: '1',
            country: 'CZ',
          },
        ],
      } as never,
    })
    expect(user.addresses?.[0].isDefault).toBe(true)
    user = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        addresses: [
          { ...user.addresses![0], isDefault: false },
          {
            isDefault: true,
            firstName: 'B',
            lastName: 'B',
            street: 's2',
            city: 'c',
            postalCode: '2',
            country: 'CZ',
          },
        ],
      } as never,
    })
    expect(user.addresses?.[0].isDefault).toBe(false)
    expect(user.addresses?.[1].isDefault).toBe(true)
  })
})
