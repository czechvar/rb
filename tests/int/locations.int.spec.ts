import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import type { Location } from '@/payload-types'

describe('locations collection', () => {
  it('creates a location with coordinates', async () => {
    const payload = await getTestPayload()
    const doc = (await payload.create({
      collection: 'locations',
      data: {
        name: `Kalymnos ${Date.now()}`,
        city: 'Kalymnos',
        country: 'Greece',
        coordinates: [26.98, 36.95],
        active: true,
      } as never,
    })) as Location
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^kalymnos-/)
    expect(doc.active).toBe(true)
    expect(doc.coordinates).toEqual([26.98, 36.95])
  })

  it('stores structured destination taxonomy and source references', async () => {
    const payload = await getTestPayload()
    const airport = await payload.create({
      collection: 'airports',
      data: {
        name: `Valencia Airport ${Date.now()}`,
        iata: `V${String(Date.now()).slice(-2)}`,
        active: true,
      },
    })
    const doc = (await payload.create({
      collection: 'locations',
      data: {
        name: `Albarracin ${Date.now()}`,
        country: 'Spain',
        locationKind: 'bouldering-area',
        destinationScope: 'area',
        contentCompleteness: 'enriched',
        climbingStyles: ['bouldering'],
        rockTypes: ['sandstone'],
        rockFeatures: ['overhangs', 'slabs'],
        settingTags: ['forest'],
        bestSeasons: ['spring', 'autumn', 'winter'],
        avoidSeasons: ['summer'],
        accommodationTags: ['apartment', 'campsite'],
        transportTags: ['car-recommended', 'flight-access'],
        nearestAirports: [{ name: 'Valencia' }, { name: 'Zaragoza' }],
        airportRefs: [airport.id],
        gradeRange: 'Font 3 to 8C',
        routeCount: 1700,
        problemCount: 1700,
        sectorCount: 15,
        destinationDetail: {
          hero: {
            heading: 'Albarracin',
            accentWord: 'Alba',
            body: 'A sandstone bouldering destination near Teruel.',
            heroStats: [
              { value: '1700+', label: 'Problems', sourceStatus: 'curated-derived' },
            ],
          },
          sections: [
            {
              key: 'intro',
              heading: 'Introduction',
              body: 'Albarracin is a sandstone bouldering destination near Teruel.',
              sourceStatus: 'curated-derived',
            },
          ],
          seasonMonths: [
            { month: 1, label: 'Jan', score: 4, tone: 'peak', sourceStatus: 'curated-derived' },
          ],
        },
        sourceReferences: [
          {
            sourceId: 'albarracin-topo',
            title: 'Albarracin climbing overview',
            url: 'https://example.com/albarracin',
            publisher: 'Example source',
            accessedAt: '2026-09-01T00:00:00.000Z',
            notes: 'Used only for integration schema round-trip coverage.',
          },
        ],
        active: true,
      } as never,
    })) as Location

    expect(doc.locationKind).toBe('bouldering-area')
    expect(doc.destinationScope).toBe('area')
    expect(doc.contentCompleteness).toBe('enriched')
    expect(doc.climbingStyles).toEqual(['bouldering'])
    expect(doc.rockTypes).toEqual(['sandstone'])
    expect(doc.rockFeatures).toEqual(['overhangs', 'slabs'])
    expect(doc.settingTags).toEqual(['forest'])
    expect(doc.bestSeasons).toEqual(['spring', 'autumn', 'winter'])
    expect(doc.avoidSeasons).toEqual(['summer'])
    expect(doc.accommodationTags).toEqual(['apartment', 'campsite'])
    expect(doc.transportTags).toEqual(['car-recommended', 'flight-access'])
    expect(doc.nearestAirports?.map((airport) => airport.name)).toEqual(['Valencia', 'Zaragoza'])
    expect((doc.airportRefs ?? []).map((airport) => (typeof airport === 'object' ? airport.id : airport))).toEqual([
      airport.id,
    ])
    expect(doc.gradeRange).toBe('Font 3 to 8C')
    expect(doc.routeCount).toBe(1700)
    expect(doc.problemCount).toBe(1700)
    expect(doc.sectorCount).toBe(15)
    expect(doc.destinationDetail?.hero?.heading).toBe('Albarracin')
    expect(doc.destinationDetail?.hero?.heroStats?.[0]?.label).toBe('Problems')
    expect(doc.destinationDetail?.sections?.[0]?.key).toBe('intro')
    expect(doc.destinationDetail?.seasonMonths?.[0]?.score).toBe(4)
    expect(doc.sourceReferences?.[0]?.sourceId).toBe('albarracin-topo')
  })

  it('allows partial imported destination records', async () => {
    const payload = await getTestPayload()
    const doc = (await payload.create({
      collection: 'locations',
      data: {
        name: `Legacy partial ${Date.now()}`,
        country: 'Norway',
        destinationScope: 'country',
        contentCompleteness: 'partial',
        active: true,
      } as never,
    })) as Location

    expect(doc.destinationScope).toBe('country')
    expect(doc.contentCompleteness).toBe('partial')
    expect(doc.locationKind).toBeNull()
    expect(doc.climbingStyles).toEqual([])
  })
})
