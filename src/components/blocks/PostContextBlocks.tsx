import Image from 'next/image'
import Link from 'next/link'
import type { Post } from '@/payload-types'
import { getPublishedPostsByCategory } from '@/lib/queries'
import { Lexical } from '@/lib/lexical'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type PostContextBlock = Record<string, unknown>

export function PostHeroBlock(_block: PostContextBlock, { post }: BlockRenderContext) {
  if (!isPost(post)) return null

  const hero = mediaUrl(post.heroImage)
  const category = typeof post.category === 'object' && post.category ? post.category : null

  return (
    <section className={styles.postHero}>
      {hero ? (
        <Image
          src={hero}
          alt={mediaAlt(post.heroImage)}
          fill
          priority
          className={styles.postHeroImage}
        />
      ) : null}
      <div className={styles.postHeroOverlay} />
      <div className={styles.postHeroInner}>
        <p className={styles.eyebrow}>{category?.name ?? 'Rockbusters Journal'}</p>
        <h1>{post.title}</h1>
        {post.excerpt ? <p className={styles.postHeroLead}>{post.excerpt}</p> : null}
        <p className={styles.postMeta}>
          {post.author || 'Rockbusters'}
          {post.publishedAt ? ` / ${formatPostDate(post.publishedAt)}` : ''}
        </p>
      </div>
    </section>
  )
}

export function PostBodyBlock(_block: PostContextBlock, { post }: BlockRenderContext) {
  if (!isPost(post) || !post.content) return null

  return (
    <section className={styles.postBodySection}>
      <div className={styles.postBodyInner}>
        <Lexical data={post.content} />
      </div>
    </section>
  )
}

export async function RelatedPostsBlock(block: PostContextBlock, { post }: BlockRenderContext) {
  if (!isPost(post)) return null

  const categoryId = getCategoryId(post.category)
  if (!categoryId) return null

  const limit = normalizeLimit(block.limit)
  const posts = (await getPublishedPostsByCategory(categoryId))
    .filter((item) => item.id !== post.id)
    .slice(0, limit)

  if (!posts.length) return null

  return (
    <section className={styles.domainGridSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Journal</p>
          <h2>{typeof block.heading === 'string' && block.heading ? block.heading : 'Related Reading'}</h2>
        </div>
        <div className={styles.domainGrid}>
          {posts.map((item) => (
            <Link key={item.id} href={`/blog/${item.slug}`} className={styles.domainCard}>
              <p className={styles.cardMeta}>{item.publishedAt ? formatPostDate(item.publishedAt) : 'Post'}</p>
              <h3>{item.title}</h3>
              {item.excerpt ? <p>{item.excerpt}</p> : null}
              <span className={styles.cardLinkText}>Read post</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PostCTABlock(_block: PostContextBlock, _context: BlockRenderContext) {
  return (
    <section className={styles.cta}>
      <div className={styles.sectionInner}>
        <div>
          <p className={styles.eyebrow}>Keep Exploring</p>
          <h2>Find the next trip worth training for.</h2>
        </div>
        <div className={styles.actionRow}>
          <Link href="/trips" className={styles.primaryButton}>
            View Trips
          </Link>
          <Link href="/calendar" className={styles.secondaryButton}>
            See Calendar
          </Link>
        </div>
      </div>
    </section>
  )
}

function isPost(post: BlockRenderContext['post']): post is Post {
  return typeof post === 'object' && post !== null
}

function getCategoryId(category: Post['category']) {
  if (typeof category === 'number') return category
  if (typeof category === 'object' && category !== null) return category.id
  return null
}

function normalizeLimit(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 3
  return Math.max(1, Math.min(6, Math.floor(value)))
}

function formatPostDate(value: string | null | undefined) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  )
}
