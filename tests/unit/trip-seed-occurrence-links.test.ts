import { expect, it } from 'vitest'
import {
  hasOccurrenceHref,
  remapOccurrenceHref,
} from '../../scripts/canonical-seed/occurrence-links'

it('remaps internal occurrence links after a full ID map is available', () => {
  const href = '/trips/climbing-trip-spain?ref=companion&date=749#programme'
  expect(remapOccurrenceHref(href, new Map())).toBe(href)
  expect(remapOccurrenceHref(href, new Map([['749', 1234]]))).toBe(
    '/trips/climbing-trip-spain?ref=companion&date=1234#programme',
  )
  expect(hasOccurrenceHref({ editorial: { companion: { links: [{ href }] } } })).toBe(true)
})
it('preserves external URLs and unrelated query values', () => {
  const ids = new Map([['749', 1234]])
  for (const href of [
    'https://example.com/trips/course?date=749',
    '//example.com/trips/course?date=749',
    '/account?date=749',
    '/trips/course?startdate=749',
  ])
    expect(remapOccurrenceHref(href, ids)).toBe(href)
  expect(hasOccurrenceHref({ text: '/trips/course?date=749' })).toBe(false)
})
