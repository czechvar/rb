import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import { checkoutTokenHash, guestCheckoutSchema, validCheckoutToken } from '@/lib/checkout/identity'
import { sendCheckoutLink } from '@/lib/checkout/notifications'

const { emailMode } = vi.hoisted(() => ({ emailMode: vi.fn(() => 'test') }))
vi.mock('@/lib/checkout/quote', () => ({ quoteCart: vi.fn() }))
vi.mock('@/lib/checkout/reservations', () => ({
  activateGuestReservation: vi.fn(),
  cancelCheckout: vi.fn(),
}))
vi.mock('@/lib/email/adapter', () => ({ resolveEmailMode: emailMode }))
vi.mock('@/lib/url', () => ({ siteUrl: (path: string) => `https://example.test${path}` }))

describe('checkout identity links', () => {
  it('rejects wrong, malformed, expired and replay-cleared tokens', () => {
    const token = 'a'.repeat(43),
      hash = checkoutTokenHash(token),
      now = Date.parse('2030-01-01T00:00:00Z')
    expect(validCheckoutToken(token, hash, '2030-01-02T00:00:00Z', now)).toBe(true)
    expect(validCheckoutToken('b'.repeat(43), hash, '2030-01-02T00:00:00Z', now)).toBe(false)
    expect(validCheckoutToken(token, hash, '2030-01-01T00:00:00Z', now)).toBe(false)
    expect(validCheckoutToken(token, null, '2030-01-02T00:00:00Z', now)).toBe(false)
    expect(validCheckoutToken(token, hash, 'not-a-date', now)).toBe(false)
  })
  it('delivers tokens only in link fragments, never request URLs', async () => {
    emailMode.mockReturnValue('test')
    const sendEmail = vi.fn().mockResolvedValue({ id: 'fixture' })
    expect(
      await sendCheckoutLink({ sendEmail } as unknown as Payload, {
        id: 7,
        email: 'fixture@example.test',
        token: 'a'.repeat(43),
        kind: 'verify',
      }),
    ).toBe('sent')
    const text = sendEmail.mock.calls[0][0].text as string
    const link = new URL(text.match(/https:\/\/[^\s]+/)![0])
    expect(link.searchParams.has('token')).toBe(false)
    expect(link.hash.startsWith('#token=')).toBe(true)
  })
  it('never passes identity links to the console adapter and reports provider failure', async () => {
    const sendEmail = vi.fn().mockRejectedValue(new Error('private-provider-diagnostic'))
    const payload = { sendEmail } as unknown as Payload
    emailMode.mockReturnValue('console')
    expect(
      await sendCheckoutLink(payload, {
        id: 7,
        email: 'fixture@example.test',
        token: 'a'.repeat(43),
        kind: 'invite',
      }),
    ).toBe('notConfigured')
    expect(sendEmail).not.toHaveBeenCalled()
    emailMode.mockReturnValue('test')
    expect(
      await sendCheckoutLink(payload, {
        id: 7,
        email: 'fixture@example.test',
        token: 'a'.repeat(43),
        kind: 'invite',
      }),
    ).toBe('failed')
  })
  it('bounds guest contact and cart inputs before expensive work', () => {
    const base = {
      submissionKey: 'ecd1649c-42ca-47a9-99f6-b3f20d5a59f3',
      contact: { name: 'Fixture', email: 'fixture@example.test', phone: '+420123456789' },
      items: [{ eventDateId: 1, quantity: 1 }],
    }
    expect(guestCheckoutSchema.safeParse(base).success).toBe(true)
    expect(
      guestCheckoutSchema.safeParse({
        ...base,
        items: Array.from({ length: 21 }, () => ({ eventDateId: 1, quantity: 1 })),
      }).success,
    ).toBe(false)
    expect(
      guestCheckoutSchema.safeParse({ ...base, contact: { ...base.contact, email: 'invalid' } })
        .success,
    ).toBe(false)
  })
})
