import { describe, expect, it } from 'vitest'
import { sanitizeRedirect } from '../../src/lib/redirect'

describe('sanitizeRedirect', () => {
  it('returns clean internal paths unchanged', () => {
    expect(sanitizeRedirect('/account')).toBe('/account')
    expect(sanitizeRedirect('/account/profile?email-changed=1')).toBe(
      '/account/profile?email-changed=1',
    )
  })

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeRedirect('//evil.example')).toBeNull()
  })

  it('rejects absolute URLs', () => {
    expect(sanitizeRedirect('https://evil.example/x')).toBeNull()
    expect(sanitizeRedirect('http://evil.example')).toBeNull()
    expect(sanitizeRedirect('javascript:alert(1)')).toBeNull()
  })

  it('rejects backslashes and missing leading slash', () => {
    expect(sanitizeRedirect('account')).toBeNull()
    expect(sanitizeRedirect('/account\\..\\evil')).toBeNull()
  })

  it('rejects empty / nullish input', () => {
    expect(sanitizeRedirect('')).toBeNull()
    expect(sanitizeRedirect(null)).toBeNull()
    expect(sanitizeRedirect(undefined)).toBeNull()
  })
})
