import { permanentRedirect } from 'next/navigation'
import { getBlogIndex, getPostCategoryBySlug, getPublishedPageBySlug } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl, collectionPageGraphJsonLd } from '@/lib/jsonld'
import { HeroBlock } from '@/components/blocks/HeroBlock'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { BlogIndex } from '@/components/blog/BlogIndex'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const category = await getPostCategoryBySlug(slug)
  return {
    title: `${category?.name || 'Stories'} — Rockbusters Blog`,
    description: category?.description || undefined,
    alternates: { canonical: absoluteUrl(`/blog/category/${slug}`) },
  }
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getPostCategoryBySlug(slug)
  if (!category) permanentRedirect('/blog')

  const [archive, page] = await Promise.all([getBlogIndex(), getPublishedPageBySlug('blog')])
  const posts = archive.posts.filter(post => post.category?.slug === category.slug)
  const hero = page?.layout?.find(block => block.blockType === 'hero')
  const grid = page?.layout?.find(block => block.blockType === 'postGrid' && block.variant === 'index')
  const selected = grid?.blockType === 'postGrid' ? grid.posts?.[0] : undefined
  const featuredId = typeof selected === 'object' ? selected.id : selected
  const featured = posts.find(post => post.id === featuredId)
  const visiblePosts = featured ? [featured, ...posts.filter(post => post.id !== featured.id)] : posts
  const jsonLd = collectionPageGraphJsonLd({
    path: `/blog/category/${category.slug}`,
    name: category.name,
    description: category.description,
    items: visiblePosts.map(post => ({ name: post.title, url: absoluteUrl(`/blog/${post.slug}`) })),
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: category.name, path: `/blog/category/${category.slug}` },
    ],
  })
  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <main>
        <HeroBlock
          {...hero}
          blockType="hero"
          variant="brandEditorial"
          eyebrow="The Rockbusters Blog"
          heading={category.name}
          accentWords={[]}
          body={category.description || `Climbing stories, insights and experiences from Rockbusters — ${category.name.toLowerCase()}.`}
          primaryAction={{ label: 'All stories', href: '/blog' }}
        />
        <BlogIndex
          key={category.slug}
          posts={posts}
          categories={archive.categories}
          archiveCategory={category.slug}
          featuredId={featuredId}
          eyebrow="Latest in this category"
          heading={category.name}
        />
        <RenderBlocks
          blocks={page?.layout?.filter(block => block.blockType !== 'hero' && block.blockType !== 'postGrid') || []}
          context={{ page: page || undefined }}
        />
      </main>
    </MarketingShell>
  )
}
