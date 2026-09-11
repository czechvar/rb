import { getPublishedPageBySlug, getPublishedPosts } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/JsonLd'
import {
  absoluteUrl,
  collectionPageGraphJsonLd,
  genericCmsPageGraphJsonLd,
  postListItems,
} from '@/lib/jsonld'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { PostCard } from './PostCard'
import styles from './blog.module.css'

export async function generateMetadata() {
  const page = await getPublishedPageBySlug('blog')
  return {
    title: page?.seo?.title || 'Blog — Rockbusters',
    description:
      page?.seo?.description ||
      'Climbing stories, coaching notes and destination guides from Rockbusters.',
    alternates: { canonical: absoluteUrl('/blog') },
  }
}

export default async function BlogPage() {
  const page = await getPublishedPageBySlug('blog')
  if (page?.layout?.length) {
    const jsonLd = await genericCmsPageGraphJsonLd(page, '/blog')
    return (
      <MarketingShell>
        <JsonLd data={jsonLd} />
        <main>
          <RenderBlocks blocks={page.layout} context={{ page }} />
        </main>
      </MarketingShell>
    )
  }
  const docs = await getPublishedPosts()
  const jsonLd = collectionPageGraphJsonLd({
    path: '/blog',
    name: 'Blog',
    description: 'Rockbusters climbing stories, updates, and practical trip notes.',
    items: postListItems(docs),
  })
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Blog' }]}>
      <JsonLd data={jsonLd} />
      <main className={styles.wrap}>
        <h1>Blog</h1>
        <div className={styles.grid}>
          {docs.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </main>
    </MarketingShell>
  )
}
