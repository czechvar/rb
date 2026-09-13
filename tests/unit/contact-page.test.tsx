import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import ContactPage, { generateMetadata } from '@/app/(frontend)/contact/page'

const { pageQuery, postsQuery, structuredData } = vi.hoisted(() => ({
  pageQuery: vi.fn(),
  postsQuery: vi.fn(async () => []),
  structuredData: vi.fn(async () => ({})),
}))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))
vi.mock('@/lib/queries', () => ({
  getPublishedPageBySlug: pageQuery,
  getPublishedPosts: postsQuery,
}))
vi.mock('@/lib/jsonld', () => ({
  absoluteUrl: (path: string) => `https://rockbusters.net${path}`,
  genericCmsPageGraphJsonLd: structuredData,
  collectionPageGraphJsonLd: () => ({}),
  postListItems: () => [],
}))
vi.mock('@/components/marketing/MarketingShell', () => ({
  MarketingShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/blocks/RenderBlocks', () => ({
  RenderBlocks: () => <section>CMS blocks</section>,
}))
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }))

describe('canonical CMS contact page', () => {
  it('uses CMS layout and SEO with the public canonical URL', async () => {
    const page = {
      id: 4,
      slug: 'contact',
      title: 'Contact',
      seo: { title: 'Get in touch', description: 'Stories' },
      layout: [{ blockType: 'contact-details' }],
    }
    pageQuery.mockResolvedValue(page)
    const html = renderToStaticMarkup(await ContactPage())
    expect(html).toContain('CMS blocks')
    expect(structuredData).toHaveBeenCalledWith(page, '/contact')
    expect(await generateMetadata()).toMatchObject({
      title: 'Get in touch',
      description: 'Stories',
      alternates: { canonical: 'https://rockbusters.net/contact' },
    })
  })

  it('returns not found when no published Contact Page exists', async () => {
    pageQuery.mockResolvedValue(null)
    await expect(ContactPage()).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
