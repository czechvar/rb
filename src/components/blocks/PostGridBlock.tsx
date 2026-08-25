import Link from 'next/link'
import type { Page, Post } from '@/payload-types'
import { resolvePostGridPosts } from '@/lib/block-resolvers/content-discovery'
import styles from './blocks.module.css'

type PostGridBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'postGrid' }>

export async function PostGridBlock({
  eyebrow,
  heading,
  intro,
  source,
  posts,
  category,
  limit,
  variant,
}: PostGridBlockProps) {
  const items = await resolvePostGridPosts({ source, posts, category, limit })
  if (!items.length) return null

  return (
    <section className={styles.domainGridSection}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className={styles.domainCard}>
      <p className={styles.cardMeta}>{post.publishedAt ? formatDate(post.publishedAt) : 'Post'}</p>
      <h3>{post.title}</h3>
      {post.excerpt ? <p>{post.excerpt}</p> : null}
      <span className={styles.cardLinkText}>Read post</span>
    </Link>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Post'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  )
}

function BlockHeader({
  eyebrow,
  heading,
  intro,
}: {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
}) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <div className={styles.sectionHeader}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className={styles.lead}>{intro}</p> : null}
    </div>
  )
}

function gridClassName(variant?: string | null) {
  return [styles.domainGrid, variant === 'compact' ? styles.domainGridCompact : '']
    .filter(Boolean)
    .join(' ')
}
