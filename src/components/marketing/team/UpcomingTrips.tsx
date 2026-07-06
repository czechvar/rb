import Link from 'next/link'
import Image from 'next/image'
import type { Difficulty, Event, EventDate, Guide, Location, Media } from '@/payload-types'
import styles from './UpcomingTrips.module.css'

type UpcomingTripsProps = { dates: EventDate[] }

function fmtRange(from: string, to: string): string {
  const f = new Date(from)
  const t = new Date(to)
  return `${f.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${t.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function firstGuideName(d: EventDate): string | null {
  const g = d.guides?.[0]
  return g && typeof g === 'object' ? (g as Guide).name : null
}

function locationName(d: EventDate): string | null {
  const l = d.locations?.[0]
  return l && typeof l === 'object' ? (l as Location).name : null
}

function currencySymbol(code: EventDate['currency']): string {
  switch (code) {
    case 'EUR':
      return '€'
    case 'CZK':
      return 'Kč'
    default:
      return code
  }
}

function gradeRange(ev: Event): string | null {
  if (!ev.difficulties?.length) return null
  const names = ev.difficulties
    .filter((d): d is Difficulty => typeof d === 'object' && 'name' in d)
    .map((d) => d.name)
  if (names.length === 0) return null
  if (names.length === 1) return names[0]
  return `${names[0]} – ${names[names.length - 1]}`
}

export function UpcomingTrips({ dates }: UpcomingTripsProps) {
  const now = new Date().toISOString()
  const upcoming = dates
    // ISO-8601 strings compare lexicographically — safe for Payload's UTC date serialisation
    .filter((d) => d.dateFrom >= now && typeof d.event === 'object')
    .slice(0, 5)
  if (upcoming.length === 0) return null

  return (
    <section className={styles.section} id="trips">
      <div className={styles.inner}>
        <div className={styles.head}>
          <div>
            <p className="section-label">Upcoming</p>
            <h2 className="section-title">
              TRIPS &amp;
              <br />
              COURSES
            </h2>
          </div>
          <Link href="/calendar" className="btn-ghost btn-sm">
            All Upcoming Trips →
          </Link>
        </div>
        <div className={styles.grid}>
          {upcoming.map((d) => {
            const ev = d.event as Event
            const photo =
              ev.mainPicture && typeof ev.mainPicture === 'object'
                ? ((ev.mainPicture as Media).url ?? null)
                : null
            const led = firstGuideName(d)
            const loc = locationName(d)
            const spots =
              typeof d.remainingSeats === 'number' ? d.remainingSeats : null
            const urgent = spots !== null && spots <= 3
            const grade = gradeRange(ev)
            const sym = currencySymbol(d.currency)

            return (
              <Link
                key={d.id}
                href={`/trips/${ev.slug}`}
                className={`${styles.card} reveal`}
              >
                {photo && (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                    className={styles.bg}
                  />
                )}
                <div className={styles.overlay} aria-hidden="true" />
                <div className={styles.content}>
                  <div className={styles.date}>{fmtRange(d.dateFrom, d.dateTo)}</div>
                  <h3 className={styles.name}>{ev.title}</h3>
                  {loc && <div className={styles.dest}>{loc}</div>}
                  {led && <div className={styles.guide}>Led by {led}</div>}
                  <div className={styles.footer}>
                    {grade && <span className={styles.gradePill}>{grade}</span>}
                    {spots !== null && spots > 0 && (
                      <span className={styles.spots}>
                        <span
                          className={`${styles.spotsDot} ${urgent ? styles.spotsDotUrgent : ''}`}
                          aria-hidden="true"
                        />
                        {spots} spots left
                      </span>
                    )}
                    {spots === 0 && (
                      <span className={styles.spots}>
                        <span
                          className={`${styles.spotsDot} ${styles.spotsDotUrgent}`}
                          aria-hidden="true"
                        />
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className={styles.price}>
                    From{' '}
                    <strong>
                      {sym}
                      {d.price.toLocaleString('en-GB')}
                    </strong>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
