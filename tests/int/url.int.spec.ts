import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { siteUrl } from '../../src/lib/url'

describe('siteUrl', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = original
  })

  it('returns NEXT_PUBLIC_SITE_URL with no trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net/'
    expect(siteUrl()).toBe('https://rockbusters.net')
  })

  it('joins a relative path', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://rockbusters.net'
    expect(siteUrl('/login')).toBe('https://rockbusters.net/login')
    expect(siteUrl('login')).toBe('https://rockbusters.net/login')
  })

  it('throws when NEXT_PUBLIC_SITE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(() => siteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })
})
