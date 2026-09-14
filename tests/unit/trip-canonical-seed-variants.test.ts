import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { CanonicalSeed } from '../../scripts/canonical-seed/shared'
import {
  migrateLaunchTripVariants,
  normalizedPromotableValue,
  TRIP_VARIANT_LAUNCH_CUTOFF,
} from '../../scripts/canonical-seed/migrate-launch-trip-variants'
import {
  buildExistingDBBackfillPlan,
  classifyExistingVariantSet,
  occurrenceMatchesReviewedFacts,
} from '../../scripts/canonical-seed/backfill-launch-trip-variants'

const seed = JSON.parse(
  readFileSync('scripts/data-import/seed/canonical-payload-seed.json', 'utf8'),
) as CanonicalSeed

function beforeMigration() {
  const copy = structuredClone(seed)
  copy.collections = copy.collections.filter(({ slug }) => slug !== 'trip-variants')
  const dates = copy.collections.find(({ slug }) => slug === 'event-dates')!.rows
  for (const date of dates) {
    delete date.tripVariant
    delete date.publicDateKey
  }
  copy.source = copy.source.replace('; offline launch Trip Variant migration', '')
  return copy
}

describe('canonical launch Trip Variant migration', () => {
  it('creates the audited launch dataset and attaches only its future occurrences', () => {
    const result = migrateLaunchTripVariants(beforeMigration())
    const variants = result.seed.collections.find(({ slug }) => slug === 'trip-variants')?.rows ?? []
    const dates = result.seed.collections.find(({ slug }) => slug === 'event-dates')!.rows

    expect(TRIP_VARIANT_LAUNCH_CUTOFF).toBe('2026-09-14')
    expect(result.report).toMatchObject({
      launchEvents: 10,
      launchEventDates: 64,
      tripVariants: 31,
      indexableVariants: 25,
      inheritedVariants: 6,
      promotedEditorialPayloads: 25,
      sameStartDateCollisions: 10,
      promotedExtraContent: 30,
      extraContentWithoutValue: 1,
      extraContentConflicts: 0,
      promotedLogisticsOverrides: 14,
      logisticsWithoutValue: 11,
      logisticsConflicts: 6,
      logisticsConflictVariants: [
        'climbing-technique-mental-coaching/kyparissi',
        'climbing-technique-mental-coaching/rodellar',
        'sport-climbing/dolomites',
        'sport-climbing/finale-ligure',
        'sport-climbing/istria',
        'sport-climbing/sella',
      ],
    })
    expect(dates.filter(({ tripVariant }) => tripVariant != null)).toHaveLength(64)
    expect(dates.filter(({ tripVariant }) => tripVariant == null)).toHaveLength(725)
    expect(dates.find(({ id }) => id === 745)?.tripVariant).toBe(651)
    expect(dates.find(({ id }) => id === 745)?.publicDateKey).toBe('2026-09-26-to-2026-10-10')
    expect(dates.find(({ id }) => id === 650)?.tripVariant).toBeUndefined()
    expect(variants.find(({ event, slug }) => event === 9 && slug === 'europe-tour')).toBeDefined()
    expect(variants.find(({ event, slug }) => event === 49 && slug === 'margalef-rodellar')).toBeDefined()
    expect(variants.find(({ event, slug }) => event === 17 && slug === 'spain-tour')).toBeDefined()
  })

  it('promotes the audited editorial source while retaining Event Date overrides', () => {
    const input = beforeMigration()
    const result = migrateLaunchTripVariants(input)
    const variants = result.seed.collections.find(({ slug }) => slug === 'trip-variants')!.rows
    const dates = result.seed.collections.find(({ slug }) => slug === 'event-dates')!.rows
    const source = dates.find(({ id }) => id === 745)!
    const kalymnos = variants.find(({ event, slug }) => event === 8 && slug === 'kalymnos')!

    expect(kalymnos).toMatchObject({ id: 651, indexable: true, editorial: source.editorial })
    expect(source.editorial).toEqual(
      input.collections.find(({ slug }) => slug === 'event-dates')!.rows.find(({ id }) => id === 745)!.editorial,
    )
    expect(variants.find(({ event, slug }) => event === 5 && slug === 'albarracin')).toMatchObject({
      indexable: false,
    })
    const inherited = variants.filter(({ indexable }) => indexable === false)
    expect(inherited).toHaveLength(6)
    expect(inherited.every(({ editorial }) => editorial == null)).toBe(true)
    expect(variants.filter(({ extraContent }) => extraContent != null)).toHaveLength(30)
    expect(variants.filter(({ logisticsOverrides }) => logisticsOverrides != null)).toHaveLength(14)
    for (const identity of result.report.logisticsConflictVariants) {
      const [eventSlug, variantSlug] = identity.split('/')
      const event = input.collections.find(({ slug }) => slug === 'events')!.rows.find(({ slug }) => slug === eventSlug)!
      expect(variants.find(({ event: id, slug }) => id === event.id && slug === variantSlug)?.logisticsOverrides).toBeNull()
    }
  })

  it('is idempotent and keeps the occurrence start-to-end identity intact', () => {
    const once = migrateLaunchTripVariants(beforeMigration()).seed
    const twice = migrateLaunchTripVariants(once).seed
    const dates = twice.collections.find(({ slug }) => slug === 'event-dates')!.rows
    const publicIdentities = dates
      .filter(({ tripVariant }) => tripVariant != null)
      .map(({ tripVariant, publicDateKey }) => `${tripVariant}:${publicDateKey}`)

    expect(twice).toEqual(once)
    expect(new Set(publicIdentities).size).toBe(64)
    expect(dates.find(({ id }) => id === 651)?.slug).toBe('kalymnos-2026-09-26-to-2026-10-03')
    expect(dates.find(({ id }) => id === 745)?.slug).toBe('kalymnos-2026-09-26-to-2026-10-10')
  })

  it('preserves the catalogue and every Event Date field outside the new relationship identity', () => {
    const input = beforeMigration()
    const migrated = migrateLaunchTripVariants(input).seed
    const originalEvents = input.collections.find(({ slug }) => slug === 'events')!.rows
    const migratedEvents = migrated.collections.find(({ slug }) => slug === 'events')!.rows
    const originalDates = input.collections.find(({ slug }) => slug === 'event-dates')!.rows
    const migratedDates = migrated.collections.find(({ slug }) => slug === 'event-dates')!.rows
    const withoutVariantIdentity = ({ tripVariant: _variant, publicDateKey: _key, ...date }: Record<string, unknown>) => date

    expect(originalEvents).toHaveLength(65)
    expect(migratedEvents).toEqual(originalEvents)
    expect(originalDates).toHaveLength(789)
    expect(migratedDates.map(withoutVariantIdentity)).toEqual(originalDates.map(withoutVariantIdentity))
  })

  it('builds an existing-database backfill plan entirely from stable public identities', () => {
    const plan = buildExistingDBBackfillPlan(seed)
    expect(plan).toHaveLength(31)
    expect(plan.flatMap(({ occurrences }) => occurrences)).toHaveLength(64)
    expect(plan.find(({ eventSlug, variantSlug }) => eventSlug === 'sport-climbing' && variantSlug === 'kalymnos')).toMatchObject({
      locationSlugs: ['kalymnos'],
      occurrences: expect.arrayContaining([
        expect.objectContaining({
          eventSlug: 'sport-climbing',
          occurrenceSlug: 'kalymnos-2026-09-26-to-2026-10-10',
          publicDateKey: '2026-09-26-to-2026-10-10',
        }),
      ]),
    })
  })

  it('requires exact reviewed occurrence dates and normalized Location sets', () => {
    const expected = {
      eventSlug: 'sport-climbing',
      occurrenceSlug: 'kalymnos-2026-09-26-to-2026-10-10',
      publicDateKey: '2026-09-26-to-2026-10-10',
      dateFrom: '2026-09-26T00:00:00.000Z',
      dateTo: '2026-10-10T00:00:00.000Z',
      locationSlugs: ['kalymnos', 'telendos'],
    }
    const locationSlugs = new Map([['28', 'kalymnos'], ['29', 'telendos'], ['30', 'rodellar']])
    expect(occurrenceMatchesReviewedFacts(expected, {
      dateFrom: '2026-09-26', dateTo: '2026-10-10', locations: [29, 28],
    }, locationSlugs)).toBe(true)
    expect(occurrenceMatchesReviewedFacts(expected, {
      dateFrom: '2026-09-27', dateTo: '2026-10-10', locations: [29, 28],
    }, locationSlugs)).toBe(false)
    expect(occurrenceMatchesReviewedFacts(expected, {
      dateFrom: '2026-09-26', dateTo: '2026-10-10', locations: [28, 30],
    }, locationSlugs)).toBe(false)
  })

  it('allows only an empty or exactly equivalent complete destination variant set', () => {
    const expected = [{
      id: 651, event: 80, slug: 'kalymnos', title: 'Course — Kalymnos', locations: [28],
      active: true, indexable: false, extraContent: null, logisticsOverrides: null,
    }]
    expect(classifyExistingVariantSet(expected, [])).toBe('empty')
    expect(classifyExistingVariantSet(expected, [{ ...expected[0], id: 9001, updatedAt: 'later' }])).toBe('complete')
    expect(() => classifyExistingVariantSet(expected, [{ ...expected[0], title: 'Edited' }])).toThrow(
      'Existing database precondition failed: variant set',
    )
    expect(() => classifyExistingVariantSet(expected, [expected[0], { ...expected[0], id: 9002 }])).toThrow(
      'Existing database precondition failed: variant set',
    )
  })

  it('normalizes generated nested IDs before comparing promotable launch content', () => {
    expect(normalizedPromotableValue({ id: 'one', root: { children: [{ id: 'child-a', text: 'Stay' }] } })).toEqual(
      normalizedPromotableValue({ id: 'two', root: { children: [{ id: 'child-b', text: 'Stay' }] } }),
    )
  })

  it('rejects duplicate Trip Variant and public date-key identities before live backfill', () => {
    const duplicate = structuredClone(seed)
    const dates = duplicate.collections.find(({ slug }) => slug === 'event-dates')!.rows
    dates.find(({ id }) => id === 745)!.dateTo = dates.find(({ id }) => id === 651)!.dateTo
    expect(() => buildExistingDBBackfillPlan(duplicate)).toThrow(
      'Reviewed Trip Variant precondition failed: public identities',
    )
  })
})
