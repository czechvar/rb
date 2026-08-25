import { describe, expect, it } from 'vitest'
import {
  catalogueBlocks,
  contentBlocks,
  conversionBlocks,
  eventLayoutBlocks,
  mediaBlocks,
  locationDetailBlocks,
  locationLayoutBlocks,
  pageBlocks,
  guideDetailBlocks,
  guideLayoutBlocks,
  programDetailBlocks,
  programLayoutBlocks,
  socialProofBlocks,
  tripDetailBlocks,
} from '@/blocks'

describe('block registry groups', () => {
  it('keeps the current page block contract while exposing grouped registries', () => {
    expect(contentBlocks.map((block) => block.slug)).toEqual([
      'hero',
      'section-intro',
      'rich-text',
      'stats',
    ])
    expect(conversionBlocks.map((block) => block.slug)).toEqual(['cta'])
    expect(catalogueBlocks.map((block) => block.slug)).toEqual([
      'tripGrid',
      'programGrid',
      'locationGrid',
      'guideGrid',
      'postGrid',
      'calendar',
    ])
    expect(mediaBlocks.map((block) => block.slug)).toEqual(['mediaBlock', 'gallery', 'video'])
    expect(socialProofBlocks.map((block) => block.slug)).toEqual([
      'faq',
      'reviewGrid',
      'partnerStrip',
      'guideProfile',
      'guideTrips',
    ])
    expect(tripDetailBlocks.map((block) => block.slug)).toEqual([
      'tripHero',
      'tripPitch',
      'tripHighlights',
      'tripDates',
      'tripBookingCTA',
      'tripLogistics',
    ])
    expect(programDetailBlocks.map((block) => block.slug)).toEqual([
      'programHero',
      'programHighlights',
      'programAudience',
      'programCurriculum',
      'programFlow',
      'programWeeks',
      'programLogistics',
      'programCoaches',
      'programResults',
      'programTrips',
      'programCTA',
    ])
    expect(locationDetailBlocks.map((block) => block.slug)).toEqual([
      'locationHero',
      'locationContent',
      'locationMap',
      'locationTrips',
    ])
    expect(guideDetailBlocks.map((block) => block.slug)).toEqual([
      'guideHero',
      'guideStats',
      'guideAbout',
      'guideVideo',
      'guidePillars',
      'guideTripsSection',
      'guideAchievements',
      'guideTestimonial',
      'guideCTA',
    ])

    expect(pageBlocks.map((block) => block.slug)).toEqual([
      'hero',
      'section-intro',
      'rich-text',
      'stats',
      'cta',
      'tripGrid',
      'programGrid',
      'locationGrid',
      'guideGrid',
      'postGrid',
      'calendar',
      'mediaBlock',
      'gallery',
      'video',
      'faq',
      'reviewGrid',
      'partnerStrip',
      'guideProfile',
      'guideTrips',
    ])
    expect(eventLayoutBlocks.map((block) => block.slug)).toEqual([
      'tripHero',
      'tripPitch',
      'tripHighlights',
      'tripDates',
      'tripBookingCTA',
      'tripLogistics',
      'calendar',
      'gallery',
      'video',
      'faq',
      'reviewGrid',
      'partnerStrip',
      'guideProfile',
    ])
    expect(programLayoutBlocks.map((block) => block.slug)).toEqual([
      'programHero',
      'programHighlights',
      'programAudience',
      'programCurriculum',
      'programFlow',
      'programWeeks',
      'programLogistics',
      'programCoaches',
      'programResults',
      'programTrips',
      'programCTA',
      'tripGrid',
      'calendar',
      'gallery',
      'video',
      'faq',
      'reviewGrid',
      'guideGrid',
    ])
    expect(locationLayoutBlocks.map((block) => block.slug)).toEqual([
      'locationHero',
      'locationContent',
      'locationMap',
      'locationTrips',
      'tripGrid',
      'calendar',
      'gallery',
      'video',
      'faq',
      'reviewGrid',
      'guideGrid',
      'partnerStrip',
      'cta',
    ])
    expect(guideLayoutBlocks.map((block) => block.slug)).toEqual([
      'guideHero',
      'guideStats',
      'guideAbout',
      'guideVideo',
      'guidePillars',
      'guideTripsSection',
      'guideAchievements',
      'guideTestimonial',
      'guideCTA',
      'guideTrips',
      'tripGrid',
      'calendar',
      'gallery',
      'video',
      'faq',
      'reviewGrid',
      'cta',
    ])
  })

  it('does not register duplicate page block slugs', () => {
    const slugs = pageBlocks.map((block) => block.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('does not register duplicate event layout block slugs', () => {
    const slugs = eventLayoutBlocks.map((block) => block.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('does not register duplicate program layout block slugs', () => {
    const slugs = programLayoutBlocks.map((block) => block.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('does not register duplicate location layout block slugs', () => {
    const slugs = locationLayoutBlocks.map((block) => block.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('does not register duplicate guide layout block slugs', () => {
    const slugs = guideLayoutBlocks.map((block) => block.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
