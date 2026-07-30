import { describe, expect, it, beforeEach } from 'vitest'
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  confirmEmailChangeTemplate,
  bookingReceivedToUserTemplate,
  bookingReceivedToAdminTemplate,
  bookingConfirmedToUserTemplate,
  bookingCancelledToUserTemplate,
} from '../../src/lib/email/templates'

describe('email templates', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net'
  })

  it('verify email contains a link with the token and the recipient name', () => {
    const html = verifyEmailTemplate({ token: 'abc123', name: 'Honza' })
    expect(html).toContain('https://rockbusters.net/verify-email?token=abc123')
    expect(html).toContain('Honza')
  })

  it('reset password email links to /reset-password/<token>', () => {
    const html = resetPasswordTemplate({ token: 'tok99', name: 'Anna' })
    expect(html).toContain('https://rockbusters.net/reset-password/tok99')
  })

  it('confirm-email-change links to /account/profile/confirm-email', () => {
    const html = confirmEmailChangeTemplate({ token: 'tok42', name: 'Jan' })
    expect(html).toContain(
      'https://rockbusters.net/account/profile/confirm-email?token=tok42',
    )
  })

  it('templates HTML-escape user-controlled input', () => {
    const html = verifyEmailTemplate({ token: 'x', name: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('booking email templates', () => {
  const baseCtx = {
    name: 'Alice',
    orderNumber: 'RB-2026-000123',
    eventTitle: 'Sandstone Spring',
    eventDate: '15–20 May 2027',
    participantCount: 2,
    totalPrice: 600,
    currency: 'EUR',
    accountOrderUrl: 'https://example.com/account/orders/1',
  }
  it('bookingReceivedToUser includes order number, trip, and account link', () => {
    const html = bookingReceivedToUserTemplate(baseCtx)
    expect(html).toContain('RB-2026-000123')
    expect(html).toContain('Sandstone Spring')
    expect(html).toContain('https://example.com/account/orders/1')
  })
  it('bookingReceivedToAdmin includes the admin URL', () => {
    const html = bookingReceivedToAdminTemplate({
      orderNumber: 'RB-2026-000123',
      userEmail: 'u@example.com',
      eventTitle: 'Sandstone Spring',
      participantCount: 2,
      adminOrderUrl: 'https://example.com/admin/collections/orders/1',
    })
    expect(html).toContain('u@example.com')
    expect(html).toContain('https://example.com/admin/collections/orders/1')
  })
  it('bookingConfirmedToUser includes bank-transfer details and variable symbol', () => {
    const html = bookingConfirmedToUserTemplate({
      ...baseCtx,
      bankTransferDetails: 'IBAN: CZ65 0800 0000 1920 0014 5399\nBeneficiary: Rockbusters s.r.o.',
    })
    expect(html).toContain('CZ65 0800 0000 1920 0014 5399')
    expect(html).toContain('RB-2026-000123')
  })
  it('bookingCancelledToUser names the order', () => {
    const html = bookingCancelledToUserTemplate(baseCtx)
    expect(html).toContain('RB-2026-000123')
    expect(html).toContain('cancelled')
  })
})
