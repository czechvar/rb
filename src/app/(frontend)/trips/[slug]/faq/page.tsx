import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { FAQList } from '@/components/sections/FAQList'

type Props = { params: Promise<{ slug: string }> }

export default async function TripFaqPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: eventDocs } = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const event = eventDocs[0]
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
        <p style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Link href={`/trips/${slug}`}>← Back to {event.title}</Link>
        </p>
      </main>
    </MarketingShell>
  )
}
