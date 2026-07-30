import Link from 'next/link'
import Image from 'next/image'
import { mediaUrl, mediaAlt } from '@/lib/media'
import type { Post } from '@/payload-types'
import styles from './blog.module.css'

export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PostCard({ post }: { post: Post }) {
  const url = mediaUrl(post.heroImage)
  const category = typeof post.category === 'object' && post.category ? post.category : null
  return (
    <Link href={`/blog/${post.slug}`} className={styles.card}>
      {url ? (
        <Image src={url} alt={mediaAlt(post.heroImage)} width={400} height={225} className={styles.photo} />
      ) : (
        <span className={styles.photoPlaceholder} aria-hidden="true" />
      )}
      <span className={styles.cardMeta}>
        {category ? `${category.name} · ` : ''}
        {formatPostDate(post.publishedAt)}
      </span>
      <span className={styles.cardTitle}>{post.title}</span>
      {post.excerpt ? <span className={styles.excerpt}>{post.excerpt}</span> : null}
    </Link>
  )
}
