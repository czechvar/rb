import { expect, it } from 'vitest'
import {
  hasOccurrenceHref,
  remapOccurrenceHref,
} from '../../scripts/canonical-seed/occurrence-links'

it('canonicalizes internal occurrence links from source identity without destination IDs', () => {
  const href = '/trips/climbing-trip-spain?ref=companion&date=749#programme'
  expect(remapOccurrenceHref(href, new Map())).toBe(href)
  expect(remapOccurrenceHref(href, new Map([['749', {
    eventSlug: 'climbing-trip-spain',
    occurrenceSlug: 'chulilla-2027-02-27',
  }]]))).toBe(
    '/trips/climbing-trip-spain/chulilla-2027-02-27?ref=companion#programme',
  )
  expect(hasOccurrenceHref({ editorial: { companion: { links: [{ href }] } } })).toBe(true)
})
it('preserves canonical, external and unrelated URLs', () => {
  const identities = new Map([['749', {
    eventSlug: 'climbing-trip-spain', occurrenceSlug: 'chulilla-2027-02-27',
  }]])
  for (const href of [
    'https://example.com/trips/course?date=749',
    '//example.com/trips/course?date=749',
    '/account?date=749',
    '/trips/course?startdate=749',
    '/trips/climbing-trip-spain/chulilla-2027-02-27#programme',
  ])
    expect(remapOccurrenceHref(href, identities)).toBe(href)
  expect(hasOccurrenceHref({ text: '/trips/course?date=749' })).toBe(false)
})
