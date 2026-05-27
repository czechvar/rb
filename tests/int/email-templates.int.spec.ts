import { describe, expect, it, beforeEach } from 'vitest'
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  confirmEmailChangeTemplate,
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
