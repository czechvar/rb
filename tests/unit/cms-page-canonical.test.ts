import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateMetadata as generatePublishedMetadata } from '@/app/(frontend)/[slug]/page'
import { generateMetadata as generatePreviewMetadata } from '@/app/(frontend)/cms-pages/[slug]/page'

const mocks = vi.hoisted(() => ({
  page: vi.fn(),
  permanentRedirect: vi.fn(),
}))

vi.mock('@/lib/queries', () => ({ getPublishedPageBySlug: mocks.page }))
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  permanentRedirect: mocks.permanentRedirect,
}))
vi.mock('@/lib/jsonld', () => ({
  absoluteUrl: (path: string) => `https://rockbusters.net${path}`,
  genericCmsPageGraphJsonLd: vi.fn(),
}))
vi.mock('@/components/marketing/MarketingShell', () => ({ MarketingShell: vi.fn() }))
vi.mock('@/components/blocks/RenderBlocks', () => ({ RenderBlocks: vi.fn() }))
vi.mock('@/components/JsonLd', () => ({ JsonLd: vi.fn() }))

const page = {
  id: 1,
  slug: 'terms-and-conditions',
  title: 'Terms and Conditions',
  layout: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.page.mockResolvedValue(page)
})

describe('generic CMS page canonical metadata', () => {
  it('uses an absolute canonical on the public root route', async () => {
    const metadata = await generatePublishedMetadata({
      params: Promise.resolve({ slug: page.slug }),
    })

    expect(metadata.alternates).toEqual({
      canonical: 'https://rockbusters.net/terms-and-conditions',
    })
  })

  it('uses absolute public canonicals on the legacy CMS route', async () => {
    const metadata = await generatePreviewMetadata({
      params: Promise.resolve({ slug: page.slug }),
    })
    expect(metadata.alternates).toEqual({
      canonical: 'https://rockbusters.net/terms-and-conditions',
    })

    mocks.page.mockResolvedValue({ ...page, slug: 'home' })
    const homeMetadata = await generatePreviewMetadata({
      params: Promise.resolve({ slug: 'home' }),
    })
    expect(homeMetadata.alternates).toEqual({ canonical: 'https://rockbusters.net/' })
  })
})
