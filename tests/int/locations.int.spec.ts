import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('locations collection', () => {
  it('creates a location with coordinates', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const doc = await payload.create({
      collection: 'locations',
      data: {
        name: `Kalymnos ${Date.now()}`,
        city: 'Kalymnos',
        country: 'Greece',
        coordinates: [26.98, 36.95],
        active: true,
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^kalymnos-/)
    expect(doc.active).toBe(true)
    expect(doc.coordinates).toEqual([26.98, 36.95])
  })

  it('stores structured destination taxonomy and source references', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
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
        gradeRange: 'Font 3 to 8C',
        routeCount: 1700,
        problemCount: 1700,
        sectorCount: 15,
        seasonSummary: 'Autumn through spring are commonly used for bouldering conditions.',
        transportSummary: 'A car is normally recommended for reaching sectors.',
        accommodationSummary: 'Apartments and campsites are common local options.',
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
      },
    })

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
    expect(doc.gradeRange).toBe('Font 3 to 8C')
    expect(doc.routeCount).toBe(1700)
    expect(doc.problemCount).toBe(1700)
    expect(doc.sectorCount).toBe(15)
    expect(doc.seasonSummary).toContain('Autumn')
    expect(doc.transportSummary).toContain('car')
    expect(doc.accommodationSummary).toContain('Apartments')
    expect(doc.sourceReferences?.[0]?.sourceId).toBe('albarracin-topo')
  })

  it('allows partial imported destination records', async () => {
    const payload = await getTestPayload()
    const doc = await payload.create({
      collection: 'locations',
      data: {
        name: `Legacy partial ${Date.now()}`,
        country: 'Norway',
        destinationScope: 'country',
        contentCompleteness: 'partial',
        active: true,
      },
    })

    expect(doc.destinationScope).toBe('country')
    expect(doc.contentCompleteness).toBe('partial')
    expect(doc.locationKind).toBeNull()
    expect(doc.climbingStyles).toEqual([])
  })
})
