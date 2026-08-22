import Image from 'next/image'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { getPublishedPostBySlug } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import { formatPostDate } from '../PostCard'
import styles from '../blog.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug) // cached — the page body reuses this
  if (!post) return { title: `${slug.replace(/-/g, ' ')} — Rockbusters Blog` }
  const title = post.seo?.title || post.title
  const description = post.seo?.description || post.excerpt
  const hero = mediaUrl(post.heroImage)
  // Omit absent fields entirely so the site-wide defaults from the root
  // layout inherit (an explicit `undefined` would remove the tag instead).
  return {
    title: `${title} — Rockbusters Blog`,
    ...(description ? { description } : {}),
    openGraph: {
      title,
      type: 'article',
      ...(description ? { description } : {}),
      ...(hero ? { images: [hero] } : {}),
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params

  const post = await getPublishedPostBySlug(slug)
  // Old-site posts that were never recreated 308 to the index per the spec —
  // deliberate SEO fallback instead of a 404.
  if (!post) permanentRedirect('/blog')

  const hero = mediaUrl(post.heroImage)
  const category = typeof post.category === 'object' && post.category ? post.category : null
  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/blog', label: 'Blog' },
        { label: post.title },
      ]}
    >
      <main className={styles.wrap}>
        <div className={styles.postHeader}>
          <h1>{post.title}</h1>
          <p className={styles.byline}>
            {post.author || 'Rockbusters'}
            {post.publishedAt ? ` · ${formatPostDate(post.publishedAt)}` : ''}
            {category ? (
              <>
                {' · '}
                <Link href={`/blog/category/${category.slug}`} className={styles.categoryLink}>
                  {category.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        {hero ? (
          <Image src={hero} alt={mediaAlt(post.heroImage)} width={1080} height={607} className={styles.heroPhoto} />
        ) : null}
        <Lexical data={post.content} />
      </main>
    </MarketingShell>
  )
}
