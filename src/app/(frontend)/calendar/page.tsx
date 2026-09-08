import Link from 'next/link'
import { getActiveEventDates } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { JsonLd } from '@/components/JsonLd'
import { calendarGraphJsonLd } from '@/lib/jsonld'
import type { Event, Location } from '@/payload-types'
import styles from './page.module.css'

function fmtDate(value: string | null | undefined): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function durationDays(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

function monthKey(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export default async function CalendarPage() {
  const upcoming = await getActiveEventDates()
  const jsonLd = calendarGraphJsonLd(upcoming)

  const groups = new Map<string, typeof upcoming>()
  for (const d of upcoming) {
    const key = monthKey(d.dateFrom)
    const arr = groups.get(key) ?? []
    arr.push(d)
    groups.set(key, arr)
  }

  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Calendar' }]}>
      <JsonLd data={jsonLd} />
      <main className={styles.page}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Upcoming dates</span>
          <h1>Calendar</h1>
          <p className={styles.lede}>
            Every bookable date across every program, in order. Click any row for the
            full trip details.
          </p>
        </header>

        {upcoming.length === 0 ? (
          <p className={styles.empty}>No upcoming dates published.</p>
        ) : (
          [...groups.entries()].map(([month, rows]) => (
            <section key={month} className={styles.group}>
              <h2 className={styles.groupHead}>{month}</h2>
              <ul className={styles.list}>
                {rows.map((d) => {
                  const event = (typeof d.event === 'object' ? d.event : null) as
                    | Event
                    | null
                  const loc = event?.locations?.[0]
                  const locName =
                    loc && typeof loc === 'object' ? (loc as Location).name : null
                  const slug = event?.slug ?? null
                  const days = durationDays(d.dateFrom, d.dateTo)

                  const body = (
                    <>
                      <div className={styles.dateCell}>
                        <span className={styles.dateRange}>
                          {fmtDate(d.dateFrom)} – {fmtDate(d.dateTo)}
                        </span>
                        <span className={styles.dateDuration}>
                          {days} day{days === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className={styles.titleCell}>
                        <span className={styles.eventTitle}>
                          {event?.title ?? 'Event'}
                        </span>
                        {locName && <span className={styles.location}>{locName}</span>}
                      </div>
                      <div className={styles.priceCell}>
                        <span className={styles.price}>
                          {d.currency} {d.price.toLocaleString()}
                        </span>
                        {typeof d.capacity === 'number' && (
                          <span className={styles.capacity}>
                            {d.capacity} spot{d.capacity === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      <span className={styles.cta} aria-hidden="true">
                        →
                      </span>
                    </>
                  )

                  return (
                    <li key={d.id} className={styles.row}>
                      {slug ? (
                        <Link href={`/trips/${slug}#dates`} className={styles.rowLink}>
                          {body}
                        </Link>
                      ) : (
                        <div className={styles.rowLink}>{body}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </main>
    </MarketingShell>
  )
}
