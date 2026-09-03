import { describe, expect, it } from 'vitest'
import { buildLocationData } from '../../scripts/data-import/import-legacy-destinations'

describe('legacy destination import mapper', () => {
  it('maps curated destination records into Payload location data', () => {
    const built = buildLocationData(
      {
        slug: 'albarracin',
        title: 'Albarracin',
        status: 'enriched',
        sources: [
          {
            id: 's1',
            title: 'Albarracin Bouldering',
            url: 'https://example.com/albarracin',
            publisher: 'Example Publisher',
            accessedAt: '2026-09-01',
            notes: 'Fixture source.',
          },
        ],
        facts: {
          locationKind: 'bouldering-area',
          destinationScope: 'area',
          climbingStyles: ['bouldering'],
          rockTypes: ['sandstone'],
          rockFeatures: ['overhangs', 'slabs'],
          settingTags: ['forest'],
          bestSeasons: ['spring', 'autumn'],
          avoidSeasons: ['summer'],
          nearestAirports: ['Valencia'],
          accommodationTags: ['campsite'],
          transportTags: ['car-recommended'],
          gradeRange: 'Font 3 to 8C',
          problemCount: 1600,
          routeCount: null,
          sectorCount: 15,
        },
        media: {
          mainImage: {
            legacyMediaId: 323,
          },
        },
        sections: [
          {
            key: 'season',
            heading: 'Season',
            status: 'legacy',
            body: 'Spring and autumn are the main windows.\n\nWinter can be good too.',
          },
          {
            key: 'transport',
            heading: 'Getting there',
            status: 'legacy',
            body: 'A car is normally recommended.',
          },
          {
            key: 'stay',
            heading: 'Where to stay',
            status: 'legacy',
            body: 'Campsites are available.',
          },
        ],
      },
      {
        slug: 'albarracin',
        latitude: 40.4,
        longitude: -1.44,
        country_nicename: 'Spain',
        keywords: 'albarracin,bouldering',
        description: 'Albarracin destination.',
      },
      new Map([['323', 'med_80e4f5c45a4da3e4428f13af']]),
      new Map([['VLC', 8087]]),
    )

    expect(built.slug).toBe('albarracin')
    expect(built.data).toMatchObject({
      name: 'Albarracin',
      slug: 'albarracin',
      active: true,
      country: 'Spain',
      coordinates: [-1.44, 40.4],
      mainPicture: 'med_80e4f5c45a4da3e4428f13af',
      locationKind: 'bouldering-area',
      destinationScope: 'area',
      contentCompleteness: 'enriched',
      climbingStyles: ['bouldering'],
      rockTypes: ['sandstone'],
      rockFeatures: ['overhangs', 'slabs'],
      settingTags: ['forest'],
      bestSeasons: ['spring', 'autumn'],
      avoidSeasons: ['summer'],
      accommodationTags: ['campsite'],
      transportTags: ['car-recommended'],
      nearestAirports: [{ name: 'Valencia' }],
      airportRefs: [8087],
      gradeRange: 'Font 3 to 8C',
      problemCount: 1600,
      sectorCount: 15,
      seo: {
        keywords: 'albarracin,bouldering',
        description: 'Albarracin destination.',
      },
    })
    expect(built.data.sourceReferences).toEqual([
      {
        sourceId: 's1',
        title: 'Albarracin Bouldering',
        url: 'https://example.com/albarracin',
        publisher: 'Example Publisher',
        accessedAt: '2026-09-01T00:00:00.000Z',
        notes: 'Fixture source.',
      },
    ])
  })

  it('rejects curated records with unknown taxonomy values', () => {
    expect(() =>
      buildLocationData(
        {
          slug: 'bad',
          title: 'Bad',
          status: 'partial',
          sources: [],
          facts: {
            climbingStyles: ['aid-climbing'],
          },
          sections: [],
        },
        undefined,
      ),
    ).toThrow('Unknown taxonomy value for climbingStyles: aid-climbing')
  })

  it('leaves mainPicture unset when the legacy media ID has no lookup entry', () => {
    const built = buildLocationData(
      {
        slug: 'andalucia',
        title: 'Andalucia',
        status: 'partial',
        sources: [],
        facts: {},
        media: {
          mainImage: {
            legacyMediaId: 1393,
          },
        },
        sections: [],
      },
      undefined,
      new Map(),
    )

    expect(built.data.mainPicture).toBeUndefined()
  })
})
