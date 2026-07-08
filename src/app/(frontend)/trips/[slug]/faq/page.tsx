import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getPublishedEventBySlug } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { FAQList } from '@/components/sections/FAQList'

type Props = { params: Promise<{ slug: string }> }

export default async function TripFaqPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const event = await getPublishedEventBySlug(slug)
  if (!event) notFound()

  const { docs: faqs } = await payload.find({
    collection: 'faqs',
    where: { and: [{ event: { equals: event.id } }, { active: { equals: true } }] },
    sort: 'position',
    limit: 100,
  })

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/calendar', label: 'Calendar' },
        { href: `/trips/${slug}`, label: event.title },
        { label: 'FAQ' },
      ]}
    >
      <main>
        <FAQList items={faqs} heading="FAQ for this trip" />
        <p style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--rb-dark)', color: 'var(--rb-white-60)' }}>
          <Link href={`/trips/${slug}`} style={{ color: 'var(--rb-white-80)', textDecoration: 'none' }}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
