import { describe, expect, it } from 'vitest'
import { normalizeActionHref } from '@/lib/safe-url'

describe('CMS contact action URLs', () => {
  it('allows plain email and international telephone actions alongside navigation', () => {
    for (const href of ['mailto:info@rockbusters.net', 'tel:+34678243573', '/contact', 'https://wa.me/34678243573']) {
      expect(normalizeActionHref(href)).toBe(href)
    }
  })
  it('rejects unsafe protocols, injected mail headers and malformed phone links', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,hello', 'mailto:info@rockbusters.net?bcc=other@example.com', 'mailto:info@rockbusters.net%0d%0aBcc:other@example.com', 'tel:call-me', '//other.example.com']) {
      expect(normalizeActionHref(href)).toBeNull()
    }
  })
})
