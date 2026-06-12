import Image from 'next/image'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import { formatPostDate } from '../PostCard'
import styles from '../blog.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Rockbusters Blog` }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  const post = docs[0]
  // Old-site posts that were never recreated 301 to the index per the spec —
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
