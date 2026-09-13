import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { RenderBlocks } from '@/components/blocks/RenderBlocks'
import { JsonLd } from '@/components/JsonLd'
import { absoluteUrl, genericCmsPageGraphJsonLd } from '@/lib/jsonld'
import { getPublishedPageBySlug } from '@/lib/queries'

export async function generateMetadata() {
  const page = await getPublishedPageBySlug('contact')
  return {
    title: page?.seo?.title || 'Contact — Rockbusters',
    description: page?.seo?.description || 'Talk to the climbers behind Rockbusters about your next climbing trip.',
    alternates: { canonical: absoluteUrl('/contact') },
  }
}

export default async function ContactPage() {
  const page = await getPublishedPageBySlug('contact')
  if (!page) notFound()
  const jsonLd = await genericCmsPageGraphJsonLd(page, '/contact')
  return (
    <MarketingShell>
      <JsonLd data={jsonLd} />
      <main><RenderBlocks blocks={page.layout} context={{ page }} /></main>
    </MarketingShell>
  )
}
