import { describe, expect, it } from 'vitest'
import {
  buildLegacyGalleryTargets,
  emptyReport,
  existingGalleryIds,
} from '../../scripts/data-import/import-legacy-galleries'

describe('legacy gallery import mapper', () => {
  it('rolls ordered legacy media into events and single-location galleries', () => {
    const report = emptyReport()
    const targets = buildLegacyGalleryTargets(
      [
        {
          eventDateId: 10,
          eventId: 1,
          eventSlug: 'kalymnos-climbing-holiday',
          eventDateSlug: 'kalymnos-may',
          start: '2026-05-01',
          galleryId: 3,
          locationSlugs: ['kalymnos'],
          galleryMediaIds: [101, 102, 101],
        },
        {
          eventDateId: 11,
          eventId: 1,
          eventSlug: 'kalymnos-climbing-holiday',
          eventDateSlug: 'kalymnos-june',
          start: '2026-06-01',
          galleryId: 4,
          locationSlugs: ['kalymnos'],
          galleryMediaIds: [102, 103],
        },
      ],
      new Map([
        ['101', 'med_a'],
        ['102', 'med_b'],
        ['103', 'med_c'],
      ]),
      report,
    )

    expect(targets.events).toEqual([
      {
        slug: 'kalymnos-climbing-holiday',
        mediaIds: ['med_a', 'med_b', 'med_c'],
      },
    ])
    expect(targets.locations).toEqual([
      {
        slug: 'kalymnos',
        mediaIds: ['med_a', 'med_b', 'med_c'],
      },
    ])
    expect(report.skippedAmbiguousLocationPlacements).toBe(0)
    expect(report.skippedEmptyPlacements).toBe(0)
  })

  it('keeps ambiguous location placements on the event only', () => {
    const report = emptyReport()
    const targets = buildLegacyGalleryTargets(
      [
        {
          eventDateId: 20,
          eventId: 2,
          eventSlug: 'andalucia-climbing',
          eventDateSlug: 'andalucia-week',
          start: '2026-04-01',
          galleryId: 5,
          locationSlugs: ['el-chorro', 'mijas'],
          galleryMediaIds: [201],
        },
      ],
      new Map([['201', 'med_d']]),
      report,
    )

    expect(targets.events).toEqual([{ slug: 'andalucia-climbing', mediaIds: ['med_d'] }])
    expect(targets.locations).toEqual([])
    expect(report.skippedAmbiguousLocationPlacements).toBe(1)
  })

  it('reports missing media and skips empty placements', () => {
    const report = emptyReport()
    const targets = buildLegacyGalleryTargets(
      [
        {
          eventDateId: 30,
          eventId: 3,
          eventSlug: 'missing-media-trip',
          eventDateSlug: 'missing-media-date',
          start: '2026-07-01',
          galleryId: 6,
          locationSlugs: ['rodellar'],
          galleryMediaIds: [301],
        },
      ],
      new Map(),
      report,
    )

    expect(targets.events).toEqual([])
    expect(targets.locations).toEqual([])
    expect(report.skippedEmptyPlacements).toBe(1)
    expect([...report.missingMedia]).toEqual(['301'])
  })

  it('reads existing gallery relation IDs from strings, numbers, and objects', () => {
    expect(
      existingGalleryIds({
        gallery: ['med_a', 42, { id: 'med_b' }, { id: 7 }, { value: 'ignored' }, null],
      }),
    ).toEqual(['med_a', '42', 'med_b', '7'])
  })
})
