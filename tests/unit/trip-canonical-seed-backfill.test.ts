import { describe, expect, it } from 'vitest'
import { backfillOccurrenceIdentities } from '../../scripts/canonical-seed/backfill-occurrence-identities'
import type { CanonicalSeed } from '../../scripts/canonical-seed/shared'

const seed = (): CanonicalSeed => ({
  generatedAt: 'old', source: 'old', collections: [
    { slug: 'events', rows: [{ id: 1, slug: 'trip', editorial: { link: { href: '/trips/trip?date=1#dates' } } }] },
    { slug: 'locations', rows: [{ id: 10, slug: 'kalymnos' }, { id: 11, slug: 'sella' }] },
    { slug: 'event-dates', rows: [
      { id: 1, event: 1, locations: [10], dateFrom: '2027-01-01T00:00:00.000Z', dateTo: '2027-01-08T00:00:00.000Z' },
      { id: 2, event: 1, locations: [10], dateFrom: '2027-01-01T00:00:00.000Z', dateTo: '2027-01-15T00:00:00.000Z' },
      { id: 3, event: 1, locations: [10], dateFrom: '2028-01-01T00:00:00.000Z', dateTo: '2028-01-08T00:00:00.000Z' },
      { id: 4, event: 1, locations: [10], dateFrom: '2028-01-01T00:00:00.000Z', dateTo: '2028-01-08T00:00:00.000Z' },
      { id: 5, event: 1, locations: [10, 11], dateFrom: '2029-01-01T00:00:00.000Z', dateTo: '2029-01-08T00:00:00.000Z' },
    ] },
  ],
})

describe('offline canonical occurrence identity backfill', () => {
  it('uses dates to qualify duration variants and marks indistinguishable legacy records noindex', () => {
    const result = backfillOccurrenceIdentities(seed(), { '5': 'island-tour-2029-01-01' })
    const rows = result.seed.collections.find((entry) => entry.slug === 'event-dates')!.rows
    expect(rows.map(({ slug, indexable, slugAliases }) => ({ slug, indexable, slugAliases }))).toEqual([
      { slug: 'kalymnos-2027-01-01-to-2027-01-08', indexable: true, slugAliases: [] },
      { slug: 'kalymnos-2027-01-01-to-2027-01-15', indexable: true, slugAliases: [] },
      { slug: 'kalymnos-2028-01-01-to-2028-01-08-legacy-record-3', indexable: false, slugAliases: [] },
      { slug: 'kalymnos-2028-01-01-to-2028-01-08-legacy-record-4', indexable: false, slugAliases: [] },
      { slug: 'island-tour-2029-01-01', indexable: true, slugAliases: [] },
    ])
    expect(result.report).toMatchObject({ total: 5, unresolvedIdentityCount: 2, missingReviewedOverrideIds: [] })
    expect(result.seed.collections[0].rows[0].editorial).toEqual({
      link: { href: '/trips/trip/kalymnos-2027-01-01-to-2027-01-08#dates' },
    })
    expect(result.report.canonicalizedHrefCount).toBe(1)
  })

  it('reports missing editorial context without inventing a slug and is idempotent', () => {
    const first = backfillOccurrenceIdentities(seed(), {})
    expect(first.report.missingReviewedOverrideIds).toEqual([5])
    const complete = backfillOccurrenceIdentities(seed(), { '5': 'island-tour-2029-01-01' })
    const repeated = backfillOccurrenceIdentities(complete.seed, { '5': 'changed-value-is-ignored' })
    expect(repeated.seed).toEqual(complete.seed)
    expect(repeated.report.changed).toBe(0)
  })

  it('gives the clean canonical slug only to a sole active record in a semantic collision', () => {
    const input = seed()
    const dates = input.collections.find((entry) => entry.slug === 'event-dates')!.rows
    dates[2].active = true
    dates[3].active = false
    const result = backfillOccurrenceIdentities(input, { '5': 'island-tour-2029-01-01' })
    expect(dates[2].slug).toBeUndefined()
    expect(result.seed.collections[2].rows[2]).toMatchObject({
      slug: 'kalymnos-2028-01-01-to-2028-01-08', indexable: true,
    })
    expect(result.seed.collections[2].rows[3]).toMatchObject({
      slug: 'kalymnos-2028-01-01-to-2028-01-08-legacy-record-4', indexable: false,
    })
    expect(result.report).toMatchObject({
      semanticCollisionRecordCount: 2,
      canonicalActiveCollisionOwners: 1,
      unresolvedIdentityCount: 1,
      quarantinedActiveCount: 0,
      quarantinedInactiveCount: 1,
    })
    expect(result.report.quarantinedIdentities).toEqual([{
      id: 4,
      active: false,
      semanticSlug: 'kalymnos-2028-01-01-to-2028-01-08',
      siblingIds: [3],
      reason: 'semantic identity collision; sole active sibling owns canonical path',
    }])
  })
})
