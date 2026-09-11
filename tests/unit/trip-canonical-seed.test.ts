import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { editorialMatches } from '../../scripts/data-import/kalymnos-editorial/editorial-readback'
import type { CanonicalSeed } from '../../scripts/canonical-seed/shared'

const seed: CanonicalSeed = JSON.parse(
  fs.readFileSync('scripts/data-import/seed/canonical-payload-seed.json', 'utf8'),
)
const manifests = [
  JSON.parse(fs.readFileSync('scripts/data-import/kalymnos-editorial/manifest.json', 'utf8')),
  ...['standalone', 'espana', 'rockroad'].flatMap((batch) =>
    JSON.parse(
      fs.readFileSync(`scripts/data-import/trip-editorial/manifests/${batch}.json`, 'utf8'),
    ),
  ),
]

it('keeps operational records outside the reusable content seed', () => {
  const slugs = seed.collections.map((collection) => collection.slug)
  for (const slug of ['users', 'orders', 'transactions', 'discount-codes', 'referrals'])
    expect(slugs).not.toContain(slug)
  for (const slug of ['events', 'event-dates', 'pages', 'locations', 'guides', 'media'])
    expect(slugs).toContain(slug)
})

describe.each(manifests)('promoted trip occurrence $target.eventDateId', (manifest) => {
  it('contains its complete reviewed editorial content under the correct parent', () => {
    const occurrence = seed.collections
      .find((collection) => collection.slug === 'event-dates')
      ?.rows.find((row) => row.id === manifest.target.eventDateId)
    expect(occurrence).toBeDefined()
    expect(occurrence?.event).toBe(manifest.target.eventId)
    expect(editorialMatches(occurrence?.editorial, manifest.editorial)).toBe(true)
  })
})
