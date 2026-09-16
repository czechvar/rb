import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage, { metadata } from '@/app/(frontend)/page'

const { pageQuery, fallbackQuery, graph } = vi.hoisted(() => ({
  pageQuery: vi.fn(),
  fallbackQuery: vi.fn(async () => []),
  graph: vi.fn(async () => ({})),
}))
vi.mock('@/lib/queries', () => ({
  getPublishedPageBySlug: pageQuery,
  getActiveEventDates: fallbackQuery,
  getFeaturedEventsForHomepage: fallbackQuery,
  getFounderGuide: fallbackQuery,
  getHomepageFAQs: fallbackQuery,
  getHomepageHeroMedia: fallbackQuery,
  getHomepagePartners: fallbackQuery,
  getHomepageReviews: fallbackQuery,
  getProClimberGuides: fallbackQuery,
}))
vi.mock('@/lib/jsonld', () => ({
  absoluteUrl: (path: string) => `https://rockbusters.net${path}`,
  homepageGraphJsonLd: graph,
}))
vi.mock('@/components/marketing/Header', () => ({ Header: () => null }))
vi.mock('@/components/marketing/Footer', () => ({ Footer: () => null }))
vi.mock('@/components/blocks/RenderBlocks', () => ({ RenderBlocks: () => null }))

beforeEach(() => vi.clearAllMocks())

describe('homepage data selection', () => {
  it('uses an absolute homepage canonical', () => {
    expect(metadata.alternates).toEqual({ canonical: 'https://rockbusters.net/' })
  })

  it('does not load unused legacy catalogue data for a published CMS layout', async () => {
    const page = { id: 1, slug: 'home', layout: [{ blockType: 'hero' }] }
    pageQuery.mockResolvedValue(page)
    await HomePage()
    expect(fallbackQuery).not.toHaveBeenCalled()
    expect(graph).toHaveBeenCalledWith({ page, heroMedia: undefined, featuredEvents: [] })
  })

  it.each([null, { id: 1, slug: 'home', layout: [] }])('retains legacy data loading without a CMS layout (%j)', async page => {
    pageQuery.mockResolvedValue(page)
    await HomePage()
    expect(fallbackQuery).toHaveBeenCalledTimes(8)
  })
})
