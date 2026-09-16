import { notFound, permanentRedirect } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl, genericCmsPageGraphJsonLd } from '@/lib/jsonld'
import { getPublishedPageBySlug } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  if (slug === 'contact') permanentRedirect('/contact')
  const page = await getPublishedPageBySlug(slug)
  if (!page) return { title: 'Page not found - Rockbusters' }

  return {
    title: page.seo?.title || `${page.title} - Rockbusters`,
    description: page.seo?.description || undefined,
    keywords: page.seo?.keywords || undefined,
    alternates: { canonical: absoluteUrl(slug === 'home' ? '/' : `/${slug}`) },
  }
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params
  if (slug === 'contact') permanentRedirect('/contact')
  const page = await getPublishedPageBySlug(slug)
  if (!page) notFound()
  const jsonLd = await genericCmsPageGraphJsonLd(page, slug === 'home' ? '/' : `/${slug}`)

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <main>
        <RenderBlocks blocks={page.layout} context={{ page }} />
      </main>
    </MarketingShell>
  )
}
