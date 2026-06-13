import { permanentRedirect } from 'next/navigation'
import { getPostCategoryBySlug, getPublishedPostsByCategory } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { PostCard } from '../../PostCard'
import styles from '../../blog.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Rockbusters Blog` }
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params

  const category = await getPostCategoryBySlug(slug)
  if (!category) permanentRedirect('/blog')

  const docs = await getPublishedPostsByCategory(category.id)
  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/blog', label: 'Blog' },
        { label: category.name },
      ]}
    >
      <main className={styles.wrap}>
        <h1>{category.name}</h1>
        {category.description ? <p>{category.description}</p> : null}
        <div className={styles.grid}>
          {docs.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </main>
    </MarketingShell>
  )
}
