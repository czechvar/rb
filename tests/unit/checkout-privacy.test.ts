import { it, expect } from 'vitest'
import { isPrivateAnalyticsPath } from '../../src/lib/analytics-privacy'
it('excludes checkout tokens, account details and auth routes from analytics', () => {
  for (const path of [
    '/checkout',
    '/checkout/verify',
    '/checkout/invite',
    '/login',
    '/reset-password/example',
    '/account/checkouts/1',
    '/book/1',
  ])
    expect(isPrivateAnalyticsPath(path)).toBe(true)
  expect(isPrivateAnalyticsPath('/trips')).toBe(false)
})
