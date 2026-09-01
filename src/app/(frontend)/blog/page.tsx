import { getPublishedPosts } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/JsonLd'
import { collectionPageGraphJsonLd, postListItems } from '@/lib/jsonld'
import { PostCard } from './PostCard'
import styles from './blog.module.css'

export const metadata = { title: 'Blog — Rockbusters' }

export default async function BlogPage() {
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
