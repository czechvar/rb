import { describe, expect, it, vi } from 'vitest'
import {
  checkoutInvitationEmail,
  checkoutPaymentTiming,
  checkoutVerificationEmail,
} from '@/lib/email/checkout-templates'
import type { CheckoutItem } from '@/lib/checkout/types'

vi.mock('@/lib/url', () => ({ siteUrl: (path: string) => `https://example.test${path}` }))

function item(balanceDueAt: string): CheckoutItem {
  return {
    eventDateId: 1,
    quantity: 1,
    title: 'Content must not appear',
    dateFrom: '2030-02-01T00:00:00.000Z',
    dateTo: '2030-02-08T00:00:00.000Z',
    currency: 'EUR',
    unitMinor: 10000,
    totalMinor: 10000,
    totalCzkMinor: null,
    depositMinor: 2500,
    depositCzkMinor: null,
    balanceDueAt,
    vat: 21,
    paidMinor: 0,
    paidCzkMinor: 0,
    refundedMinor: 0,
    refundedCzkMinor: 0,
    discountMinor: 0,
    discountCommissionMinor: 0,
    referralCommissionMinor: 0,
  }
}

describe('checkout transactional email templates', () => {
  it('renders a prominent verification code without marketing content or links', () => {
    const email = checkoutVerificationEmail({ code: '042681' })

    expect(email.subject).toBe('Your Rockbusters verification code')
    expect(email.text).toContain('042681')
    expect(email.html).toContain('>042681<')
    expect(email.html).toContain('font-weight:800')
    expect(email.html).toContain('#e30713')
    expect(email.html).toContain('/logo-rockbusters.png')
    expect(email.html).not.toContain('<a ')
    expect(`${email.html} ${email.text}`).not.toMatch(/climbing|trip details|newsletter/i)
  })

  it('describes the exact payment timing without including trip content', () => {
    const url = 'https://example.test/checkout/invite?checkout=7#token=secret'
    const deposit = checkoutInvitationEmail({ url, paymentTiming: 'deposit' })
    const full = checkoutInvitationEmail({ url, paymentTiming: 'full' })
    const mixed = checkoutInvitationEmail({ url, paymentTiming: 'mixed' })

    expect(deposit.text).toContain('25% deposit')
    expect(full.text).toContain('full amount')
    expect(full.text).toContain('within 30 days')
    expect(mixed.text).toContain('deposit for later departures')
    expect(mixed.text).toContain('full amount for departures within 30 days')
    expect(deposit.html).toContain('Continue to account and payment')
    expect(deposit.html).toContain(url)
    expect(`${deposit.html} ${deposit.text}`).not.toContain('Content must not appear')
  })

  it('derives deposit, full and mixed payment timing from active balance deadlines', () => {
    const now = new Date('2030-01-01T00:00:00.000Z')
    expect(checkoutPaymentTiming([item('2030-01-02T00:00:00.000Z')], now)).toBe('deposit')
    expect(checkoutPaymentTiming([item('2029-12-31T00:00:00.000Z')], now)).toBe('full')
    expect(
      checkoutPaymentTiming(
        [item('2029-12-31T00:00:00.000Z'), item('2030-01-02T00:00:00.000Z')],
        now,
      ),
    ).toBe('mixed')
  })
})
