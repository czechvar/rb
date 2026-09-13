import { permanentRedirect } from 'next/navigation'
import { getPublishedPostBySlug } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { blogPostGraphJsonLd } from '@/lib/jsonld'
import { BlogPost } from '@/components/blog/BlogPost'

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

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <BlogPost post={post} />
    </MarketingShell>
  )
}
