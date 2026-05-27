import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import type { Event, EventDate, Location } from '@/payload-types'
import styles from './page.module.css'

function fmtDate(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function locationLabel(loc: Event['locations']): string | null {
  if (!loc?.length) return null
  const first = loc[0]
  return typeof first === 'object' ? (first as Location).name : null
}

export default async function ProgramsIndex() {
  const payload = await getPayloadClient()

  const { docs: events } = await payload.find({
    collection: 'events',
    where: { state: { equals: 'published' } },
    sort: '-featured',
    depth: 1,
    limit: 100,
  })

  const eventIds = events.map((e) => e.id)
  const { docs: dates } =
    eventIds.length === 0
      ? { docs: [] as EventDate[] }
      : await payload.find({
          collection: 'event-dates',
          where: {
            and: [{ event: { in: eventIds } }, { active: { equals: true } }],
          },
          sort: 'dateFrom',
          depth: 0,
          limit: 500,
        })

  const datesByEvent = new Map<number, EventDate[]>()
  for (const d of dates) {
    const eventId = typeof d.event === 'object' ? d.event.id : d.event
    const arr = datesByEvent.get(eventId) ?? []
    arr.push(d)
    datesByEvent.set(eventId, arr)
  }

  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Programs' }]}>
      <main className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>What we run</span>
          <h1>Programs</h1>
          <p className={styles.lede}>
            Camps, coaching weeks, and guided trips — pick the format that fits the
            climber you want to be six months from now.
          </p>
        </header>

        {events.length === 0 ? (
          <p className={styles.empty}>No published programs yet.</p>
        ) : (
          <ul className={styles.grid}>
            {events.map((ev) => {
              const evDates = datesByEvent.get(ev.id) ?? []
              const first = evDates[0]
              const lowestPrice = evDates.reduce<EventDate | null>(
                (acc, d) => (acc === null || d.price < acc.price ? d : acc),
                null,
              )
              const loc = locationLabel(ev.locations)
              return (
                <li key={ev.id} className={styles.card}>
                  <Link href={`/trips/${ev.slug}`} className={styles.cardLink}>
                    <div className={styles.cardHead}>
                      <h2>{ev.title}</h2>
                      {loc && <span className={styles.cardLoc}>{loc}</span>}
                    </div>
                    {ev.shortDescription && (
                      <p className={styles.cardDesc}>{ev.shortDescription}</p>
                    )}
                    <dl className={styles.cardFacts}>
                      <div>
                        <dt>Next date</dt>
                        <dd>{first ? fmtDate(first.dateFrom) : 'TBA'}</dd>
                      </div>
                      <div>
                        <dt>From</dt>
                        <dd>
                          {lowestPrice
                            ? `${lowestPrice.currency} ${lowestPrice.price.toLocaleString()}`
                            : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt>Variants</dt>
                        <dd>{evDates.length || '—'}</dd>
                      </div>
                    </dl>
                    <span className={styles.cardCta}>View trip →</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </MarketingShell>
  )
}
