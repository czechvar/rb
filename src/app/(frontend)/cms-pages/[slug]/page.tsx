import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { genericCmsPageGraphJsonLd } from '@/lib/jsonld'
import { getPublishedPageBySlug } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedPageBySlug(slug)
  if (!page) return { title: 'Page not found - Rockbusters' }

  return {
    title: page.seo?.title || `${page.title} - Rockbusters`,
    description: page.seo?.description || undefined,
    keywords: page.seo?.keywords || undefined,
  }
}

export default async function CMSPage({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedPageBySlug(slug)
  if (!page) notFound()
  const jsonLd = await genericCmsPageGraphJsonLd(page)

  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <main>
        <RenderBlocks blocks={page.layout} context={{ page }} />
      </main>
    </MarketingShell>
  )
}
