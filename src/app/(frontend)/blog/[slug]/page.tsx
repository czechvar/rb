import Image from 'next/image'
import Link from 'next/link'
import { permanentRedirect } from 'next/navigation'
import { getPublishedPostBySlug } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { blogPostGraphJsonLd } from '@/lib/jsonld'
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

  const post = await getPublishedPostBySlug(slug)
  // Old-site posts that were never recreated 308 to the index per the spec —
  // deliberate SEO fallback instead of a 404.
  if (!post) permanentRedirect('/blog')
  const jsonLd = blogPostGraphJsonLd(post)

  if (post.layout?.length) {
    return (
      <MarketingShell
        crumbs={[
          { href: '/', label: 'Home' },
          { href: '/blog', label: 'Blog' },
          { label: post.title },
        ]}
      >
        <JsonLd data={jsonLd} />
        <RenderBlocks blocks={post.layout} context={{ post }} />
      </MarketingShell>
    )
  }

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
      <JsonLd data={jsonLd} />
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
