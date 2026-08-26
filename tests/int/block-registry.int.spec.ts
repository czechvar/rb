import { describe, expect, it } from 'vitest'
import {
  blockCatalogue,
  blocksFor,
  catalogueBlocks,
  contentBlocks,
  conversionBlocks,
  eventLayoutBlocks,
  isBlockCompatibleWithSurface,
  mediaBlocks,
  locationDetailBlocks,
  locationLayoutBlocks,
  pageBlocks,
  guideDetailBlocks,
  guideLayoutBlocks,
  postDetailBlocks,
  postLayoutBlocks,
  programDetailBlocks,
  programLayoutBlocks,
  socialProofBlocks,
  tripDetailBlocks,
} from '@/blocks'

describe('block registry groups', () => {
  const reusableBlockSlugs = [
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
  ]

  it('exposes categorized block groups from the catalogue', () => {
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
    expect(postDetailBlocks.map((block) => block.slug)).toEqual([
      'postHero',
      'postBody',
      'relatedPosts',
      'postCTA',
    ])
  })

  it('builds surface block lists from compatibility metadata', () => {
    expect(pageBlocks.map((block) => block.slug)).toEqual([
      ...reusableBlockSlugs,
    ])
    expect(eventLayoutBlocks.map((block) => block.slug)).toEqual([
      ...reusableBlockSlugs,
      'tripHero',
      'tripPitch',
      'tripHighlights',
      'tripDates',
      'tripBookingCTA',
      'tripLogistics',
    ])
    expect(programLayoutBlocks.map((block) => block.slug)).toEqual([
      ...reusableBlockSlugs,
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
    expect(locationLayoutBlocks.map((block) => block.slug)).toEqual([
      ...reusableBlockSlugs,
      'locationHero',
      'locationContent',
      'locationMap',
      'locationTrips',
    ])
    expect(guideLayoutBlocks.map((block) => block.slug)).toEqual([
      ...reusableBlockSlugs,
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
    expect(postLayoutBlocks.map((block) => block.slug)).toEqual([
      ...reusableBlockSlugs,
      'postHero',
      'postBody',
      'relatedPosts',
      'postCTA',
    ])
  })

  it('uses blacklist compatibility by default', () => {
    const hero = blockCatalogue.find((entry) => entry.config.slug === 'hero')
    const tripHero = blockCatalogue.find((entry) => entry.config.slug === 'tripHero')

    expect(hero?.compatibleWith).toBeUndefined()
    expect(hero && isBlockCompatibleWithSurface(hero, 'page')).toBe(true)
    expect(hero && isBlockCompatibleWithSurface(hero, 'event')).toBe(true)
    expect(tripHero && isBlockCompatibleWithSurface(tripHero, 'event')).toBe(true)
    expect(tripHero && isBlockCompatibleWithSurface(tripHero, 'page')).toBe(false)
    expect(blocksFor('event').map((block) => block.slug)).toEqual(
      eventLayoutBlocks.map((block) => block.slug),
    )
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

  it('does not register duplicate post layout block slugs', () => {
    const slugs = postLayoutBlocks.map((block) => block.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
