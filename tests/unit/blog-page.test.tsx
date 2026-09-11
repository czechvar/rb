import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import BlogPage, { generateMetadata } from '@/app/(frontend)/blog/page'

const { pageQuery, postsQuery, structuredData } = vi.hoisted(() => ({
  pageQuery: vi.fn(),
  postsQuery: vi.fn(async () => []),
  structuredData: vi.fn(async () => ({})),
}))
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

describe('canonical CMS blog page', () => {
  it('uses CMS layout and SEO with the public canonical URL', async () => {
    const page = {
      id: 4,
      slug: 'blog',
      title: 'Blog',
      seo: { title: 'Journal', description: 'Stories' },
      layout: [{ blockType: 'postGrid', variant: 'index' }],
    }
    pageQuery.mockResolvedValue(page)
    const html = renderToStaticMarkup(await BlogPage())
    expect(html).toContain('CMS blocks')
    expect(structuredData).toHaveBeenCalledWith(page, '/blog')
    expect(await generateMetadata()).toMatchObject({
      title: 'Journal',
      description: 'Stories',
      alternates: { canonical: 'https://rockbusters.net/blog' },
    })
  })

  it('keeps the original listing when no published CMS layout is available', async () => {
    pageQuery.mockResolvedValue(null)
    const html = renderToStaticMarkup(await BlogPage())
    expect(html).toContain('<h1>Blog</h1>')
    expect(html).not.toContain('CMS blocks')
    expect(postsQuery).toHaveBeenCalled()
  })
})
