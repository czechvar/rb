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
    title: 'Kalymnos Climbing Week',
    location: 'Kalymnos, Greece',
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

  it('includes reservation details and describes the exact payment timing', () => {
    const url = 'https://example.test/checkout/invite?checkout=7#token=secret'
    const items = [item('2030-01-02T00:00:00.000Z')]
    const shared = { url, reference: 'RB-C-123', items }
    const deposit = checkoutInvitationEmail({ ...shared, paymentTiming: 'deposit' })
    const full = checkoutInvitationEmail({ ...shared, paymentTiming: 'full' })
    const mixed = checkoutInvitationEmail({ ...shared, paymentTiming: 'mixed' })

    expect(deposit.text).toContain('25% deposit')
    expect(full.text).toContain('full amount')
    expect(full.text).toContain('within 30 days')
    expect(mixed.text).toContain('deposit for later departures')
    expect(mixed.text).toContain('full amount for departures within 30 days')
    expect(deposit.html).toContain('Continue to account and payment')
    expect(deposit.html).toContain(url)
    for (const detail of [
      'RB-C-123',
      'Kalymnos Climbing Week',
      'Kalymnos, Greece',
      '1 Feb 2030',
      '8 Feb 2030',
      '€100.00',
    ])
      expect(`${deposit.html} ${deposit.text}`).toContain(detail)
    expect(deposit.text).toContain('Participants: 1')
    expect(deposit.html).toContain('1 participant')
  })

  it('escapes reservation content in invitation HTML', () => {
    const unsafe = item('2030-01-02T00:00:00.000Z')
    unsafe.title = '<script>unsafe</script>'
    unsafe.location = 'Crag & Coast'
    const email = checkoutInvitationEmail({
      url: 'https://example.test/invite',
      reference: 'RB-C-<7>',
      items: [unsafe],
      paymentTiming: 'deposit',
    })

    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;unsafe&lt;/script&gt;')
    expect(email.html).toContain('Crag &amp; Coast')
    expect(email.html).toContain('RB-C-&lt;7&gt;')
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
