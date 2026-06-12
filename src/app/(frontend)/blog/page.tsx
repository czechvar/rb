import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { PostCard } from './PostCard'
import styles from './blog.module.css'

export const metadata = { title: 'Blog — Rockbusters' }

export default async function BlogPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { state: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
    depth: 1,
  })
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Blog' }]}>
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
