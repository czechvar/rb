import { describe, expect, it } from 'vitest'
import { comparable, verifySnapshots } from '../../scripts/canonical-seed/verify'
import type { CanonicalSeed } from '../../scripts/canonical-seed/shared'
import type { SeedIDMap } from '../../scripts/seed'

const source: CanonicalSeed = {
  generatedAt: '',
  source: '',
  collections: [
    { slug: 'events', rows: [{ id: 8, title: 'Course', slug: 'course' }] },
    {
      slug: 'event-dates',
      rows: [
        {
          id: 745,
          event: 8,
          editorial: {
            hero: {
              title: [
                { text: 'Un', accent: false },
                { text: 'stoppable', accent: true },
              ],
            },
          },
        },
      ],
    },
  ],
}
const maps: SeedIDMap = new Map([
  ['events', new Map([['8', 1]])],
  ['event-dates', new Map([['745', 2]])],
])
function target(): CanonicalSeed {
  const result = structuredClone(source)
  result.collections[0].rows[0].id = 1
  result.collections[1].rows[0].id = 2
  result.collections[1].rows[0].event = 1
  return result
}
describe('canonical seed read-back verification', () => {
  it('accepts regenerated CMS IDs and timestamps while comparing mapped relationships', () => {
    const actual = target()
    actual.collections[0].rows[0].updatedAt = '2026-09-11'
    expect(verifySnapshots(source, actual, maps)).toEqual({
      collections: 2,
      rows: 2,
      enrichedOccurrences: 1,
    })
  })
  it('rejects a relationship left pointing to its source ID', () => {
    const actual = target()
    actual.collections[1].rows[0].event = 8
    expect(() => verifySnapshots(source, actual, maps)).toThrow('Content mismatch')
  })
  it('rejects missing rich content and extra records', () => {
    const actual = target()
    actual.collections[1].rows[0].editorial = null
    expect(() => verifySnapshots(source, actual, maps)).toThrow('Content mismatch')
    actual.collections[1].rows.push({ id: 3 })
    expect(() => verifySnapshots(source, actual, maps)).toThrow('Collection count mismatch')
  })
  it('independently checks occurrence links against remapped date IDs', () => {
    const expected = structuredClone(source)
    expected.collections[0].rows[0].editorial = {
      companion: { options: [{ href: '/trips/course?date=745' }] },
    }
    const actual = target()
    actual.collections[0].rows[0].editorial = {
      companion: { options: [{ href: '/trips/course?date=2' }] },
    }
    expect(verifySnapshots(expected, actual, maps).rows).toBe(2)
    actual.collections[0].rows[0].editorial = {
      companion: { options: [{ href: '/trips/course?date=745' }] },
    }
    expect(() => verifySnapshots(expected, actual, maps)).toThrow('Occurrence link mismatch')
  })
  it('preserves authored segment order, accents, and explicit break flags', () => {
    expect(
      comparable([
        { id: 'a', text: 'Un', accent: true },
        { text: 'done', breakBefore: true },
      ]),
    ).not.toEqual(
      comparable([
        { text: 'done', breakBefore: true },
        { text: 'Un', accent: true },
      ]),
    )
  })
})
