import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateMetadata as generateTripsMetadata } from '@/app/(frontend)/trips/page'
import { generateMetadata as generateDestinationsMetadata } from '@/app/(frontend)/destinations/page'
import { metadata as programsMetadata } from '@/app/(frontend)/programs/page'
import { metadata as calendarMetadata } from '@/app/(frontend)/calendar/page'

const mocks = vi.hoisted(() => ({ page: vi.fn() }))

vi.mock('@/lib/queries', () => ({ getPublishedPageBySlug: mocks.page }))
vi.mock('@/lib/jsonld', () => ({
  absoluteUrl: (path: string) => `https://rockbusters.net${path}`,
  calendarGraphJsonLd: vi.fn(),
  collectionPageGraphJsonLd: vi.fn(),
  genericCmsPageGraphJsonLd: vi.fn(),
  locationListItems: vi.fn(),
  tripListItems: vi.fn(),
}))
vi.mock('@/components/JsonLd', () => ({ JsonLd: vi.fn() }))
vi.mock('@/components/blocks/RenderBlocks', () => ({ RenderBlocks: vi.fn() }))
vi.mock('@/components/marketing/MarketingShell', () => ({ MarketingShell: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.page.mockImplementation(async (slug: string) => ({
    id: 1,
    slug,
    title: slug[0].toUpperCase() + slug.slice(1),
    layout: [],
  }))
})

describe('top-level hub canonical metadata', () => {
  it('defines absolute canonicals for static hub metadata', () => {
    expect(programsMetadata.alternates).toEqual({ canonical: 'https://rockbusters.net/programs' })
    expect(calendarMetadata.alternates).toEqual({ canonical: 'https://rockbusters.net/calendar' })
  })

  it('defines absolute canonicals for CMS-backed hub metadata', async () => {
    await expect(generateTripsMetadata()).resolves.toMatchObject({
      alternates: { canonical: 'https://rockbusters.net/trips' },
    })
    await expect(generateDestinationsMetadata()).resolves.toMatchObject({
      alternates: { canonical: 'https://rockbusters.net/destinations' },
    })
  })

  it('keeps the trips canonical when its CMS page is unavailable', async () => {
    mocks.page.mockResolvedValue(null)
    await expect(generateTripsMetadata()).resolves.toMatchObject({
      alternates: { canonical: 'https://rockbusters.net/trips' },
    })
  })
})
