import { notFound } from 'next/navigation'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { genericCmsPageGraphJsonLd } from '@/lib/jsonld'
import { getPublishedPageBySlug } from '@/lib/queries'

export async function generateMetadata() {
  const page = await getPublishedPageBySlug('trips')
  if (!page) return { title: 'Trips & Courses - Rockbusters' }

  return {
    title: page.seo?.title || `${page.title} - Rockbusters`,
    description: page.seo?.description || undefined,
    keywords: page.seo?.keywords || undefined,
  }
}

export default async function TripsPage() {
  const page = await getPublishedPageBySlug('trips')
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
