import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'

type Props = { params: Promise<{ slug: string }> }

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'types',
    where: { and: [{ slug: { equals: slug } }, { state: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  const type = docs[0]
  if (!type) notFound()

  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/programs', label: 'Programs' },
        { label: type.name },
      ]}
    >
      <main>
        <h1>{type.name}</h1>
        {/* Section components wired in subsequent tasks */}
      </main>
    </MarketingShell>
  )
}
