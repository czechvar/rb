import Link from 'next/link'
import Image from 'next/image'
import type { Event, EventDate, Location, Media } from '@/payload-types'
import styles from './FeaturedTrips.module.css'

type FeaturedTripsProps = {
  events: Event[]
  datesByEvent: Map<number, EventDate[]>
}

function fmtRange(from: string | null | undefined, to: string | null | undefined): string {
  if (!from) return ''
  const f = new Date(from)
  const optsLong: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  if (!to) return f.toLocaleDateString('en-GB', optsLong)
  const t = new Date(to)
  return `${f.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${t.toLocaleDateString('en-GB', optsLong)}`
}

function lowestPrice(dates: EventDate[]): EventDate | null {
  return dates.reduce<EventDate | null>(
    (acc, d) => (acc === null || d.price < acc.price ? d : acc),
    null,
  )
}

function locationLabel(locs: Event['locations']): string | null {
  if (!locs?.length) return null
  const first = locs[0]
  return typeof first === 'object' ? (first as Location).name : null
}

function mediaUrl(picture: Event['mainPicture']): string | null {
  if (!picture || typeof picture !== 'object') return null
  return (picture as Media).url ?? null
}

export function FeaturedTrips({ events, datesByEvent }: FeaturedTripsProps) {
  if (events.length === 0) return null

  const [hero, ...rest] = events

  function renderCard(ev: Event, opts: { wide?: boolean } = {}) {
    const dates = datesByEvent.get(ev.id) ?? []
    const lp = lowestPrice(dates)
    const first = dates[0]
    const loc = locationLabel(ev.locations)
    const bgUrl = mediaUrl(ev.mainPicture)

    return (
      <Link
        href={`/trips/${ev.slug}`}
        key={ev.id}
        className={`${styles.card} ${opts.wide ? styles.cardWide : ''} reveal`}
      >
        {bgUrl && (
          <Image
            src={bgUrl}
            alt=""
            fill
            sizes={opts.wide ? '100vw' : '(max-width: 768px) 100vw, 33vw'}
            className={styles.cardBg}
          />
        )}
        <div className={styles.cardOverlay} aria-hidden="true" />
        <div className={styles.cardTop}>
          <div className={styles.cardMeta}>
            {loc && <span className={styles.cardLoc}>{loc}</span>}
            {first && (
              <>
                <span className={styles.cardDot} />
                <span className={styles.cardDates}>{fmtRange(first.dateFrom, first.dateTo)}</span>
              </>
            )}
          </div>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{ev.title}</h3>
          {ev.shortDescription && <p className={styles.cardHook}>{ev.shortDescription}</p>}
          <div className={styles.cardPriceRow}>
            {lp && (
              <span className={styles.cardPrice}>
                From {lp.currency} {lp.price.toLocaleString()}
              </span>
            )}
          </div>
          <span className={styles.cardCta}>Book This Trip →</span>
        </div>
      </Link>
    )
  }

  return (
    <section className={styles.section} id="featured">
      <div className={styles.labelWrap}>
        <div>
          <p className="section-label">Rockbusters Picks</p>
          <h2 className="section-title">
            TRIPS &amp; COURSES
            <br />
            WORTH CLIMBING FOR
          </h2>
        </div>
        <Link href="/programs" className={styles.viewAll}>
          View All Trips &amp; Courses →
        </Link>
      </div>

      <div className={styles.grid}>
        {renderCard(hero, { wide: true })}
        {rest.map((ev) => renderCard(ev))}
      </div>
    </section>
  )
}
