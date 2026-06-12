import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from '../destinations.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Rockbusters Destinations` }
}

function osmEmbedSrc(lng: number, lat: number) {
  const bbox = [lng - 0.05, lat - 0.03, lng + 0.05, lat + 0.03].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'locations',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  const loc = docs[0]
  if (!loc) notFound()

  const { docs: events } = await payload.find({
    collection: 'events',
    where: { and: [{ locations: { contains: loc.id } }, { state: { equals: 'published' } }] },
    limit: 20,
    depth: 0,
  })

  const hero = mediaUrl(loc.mainPicture)
  const [lng, lat] = loc.coordinates ?? [null, null]
  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/destinations', label: 'Destinations' },
        { label: loc.name },
      ]}
    >
      <main className={styles.wrap}>
        <div className={styles.detailHeader}>
          <h1>{loc.name}</h1>
          {loc.country ? <p className={styles.countryLine}>{loc.country}</p> : null}
        </div>
        {hero ? (
          <Image
            src={hero}
            alt={mediaAlt(loc.mainPicture)}
            width={1080}
            height={540}
            className={styles.heroPhoto}
          />
        ) : null}
        <Lexical data={loc.content} />

        {typeof lng === 'number' && typeof lat === 'number' ? (
          <div className={styles.map}>
            <iframe
              src={osmEmbedSrc(lng, lat)}
              title={`Map of ${loc.name}`}
              loading="lazy"
            />
          </div>
        ) : null}

        <section>
          <h2>Trips in {loc.name}</h2>
          {events.length ? (
            <ul className={styles.tripList}>
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={`/trips/${e.slug}`}>{e.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No trips scheduled here right now — see the calendar for what&apos;s next.</p>
          )}
        </section>
      </main>
    </MarketingShell>
  )
}
