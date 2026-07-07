import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getGuideBySlug, getPublishedEventsForGuide } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { GuideHero } from '@/components/marketing/team/GuideHero'
import { Lexical } from '@/lib/lexical'
import { mediaUrl } from '@/lib/media'
import styles from './guide.module.css'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  return { title: `${guide?.name ?? 'Guide'} — Rockbusters Team` }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  if (!guide) notFound()

  // Email/phone exist on the collection but are intentionally not rendered —
  // public team pages must not leak contacts (see team-pages spec).
  const events = await getPublishedEventsForGuide(guide.id)

  return (
    <MarketingShell transparentHeader>
      <main className={styles.page}>
        <GuideHero guide={guide} />

        {guide.content ? (
          <section className={styles.bio}>
            <Lexical data={guide.content} />
          </section>
        ) : null}

        {guide.vimeoId ? (
          <section className={styles.video}>
            <iframe
              src={`https://player.vimeo.com/video/${guide.vimeoId}`}
              title={`${guide.name} — video`}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </section>
        ) : null}

        <section className={styles.trips}>
          <h2 className="section-title">Trips with {guide.name}</h2>
          {events.length ? (
            <div className={styles.tripGrid}>
              {events.map((e) => {
                const bg = mediaUrl(e.mainPicture)
                return (
                  <Link key={e.id} href={`/trips/${e.slug}`} className={styles.tripCard}>
                    {bg && <Image src={bg} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className={styles.tripBg} />}
                    <div className={styles.tripScrim} aria-hidden="true" />
                    <h3 className={styles.tripTitle}>{e.title}</h3>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className={styles.empty}>
              {guide.name} joins selected camps throughout the season — see the calendar for dates.
            </p>
          )}
        </section>

        <section className={styles.cta}>
          <h2 className="section-title">Climb with {guide.name.split(' ')[0]}</h2>
          <Link href="/calendar" className="btn-primary">
            Find your trip
          </Link>
        </section>
      </main>
    </MarketingShell>
  )
}
