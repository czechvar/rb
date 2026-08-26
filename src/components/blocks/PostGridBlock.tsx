import type { Page } from '@/payload-types'
import { resolvePostGridPosts } from '@/lib/block-resolvers/content-discovery'
import { BlockHeader, PostCard } from './CatalogueCards'
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

function gridClassName(variant?: string | null) {
  return [styles.domainGrid, variant === 'compact' ? styles.domainGridCompact : '']
    .filter(Boolean)
    .join(' ')
}
