import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from '../team.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Rockbusters Team` }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'guides',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  const guide = docs[0]
  if (!guide) notFound()

  // Email/phone exist on the collection but are intentionally not rendered —
  // public team pages must not leak contacts (see team-pages spec).
  const { docs: events } = await payload.find({
    collection: 'events',
    where: { and: [{ coaches: { contains: guide.id } }, { state: { equals: 'published' } }] },
    limit: 20,
    depth: 0,
  })

  const photo = mediaUrl(guide.photo)
  return (
    <MarketingShell
      crumbs={[
        { href: '/', label: 'Home' },
        { href: '/team', label: 'Team' },
        { label: guide.name },
      ]}
    >
      <main className={styles.wrap}>
        <div className={styles.profile}>
          {photo ? (
            <Image
              src={photo}
              alt={mediaAlt(guide.photo)}
              width={320}
              height={320}
              className={styles.profilePhoto}
            />
          ) : null}
          <div>
            <h1>{guide.name}</h1>
            {guide.role ? <p className={styles.roleLine}>{guide.role}</p> : null}
            <Lexical data={guide.content} />
          </div>
        </div>

        {guide.vimeoId ? (
          <div className={styles.video}>
            <iframe
              src={`https://player.vimeo.com/video/${guide.vimeoId}`}
              title={`${guide.name} — video`}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}

        <section>
          <h2>Upcoming trips with {guide.name}</h2>
          {events.length ? (
            <ul className={styles.tripList}>
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={`/trips/${e.slug}`}>{e.title}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>{guide.name} joins selected camps throughout the season — see the calendar for dates.</p>
          )}
        </section>
      </main>
    </MarketingShell>
  )
}
