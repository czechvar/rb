import Image from 'next/image'
import Link from 'next/link'
import type { EventDate, Location, TripVariant } from '@/payload-types'
import { checkoutEntryHref } from '@/lib/checkout/feature'
import { mediaUrl } from '@/lib/media'
import { canCheckoutEventDate, eventDateLifecycle } from '@/lib/event-date-visibility'
import { tripVariantPath } from '@/lib/occurrence-routing'
import styles from './ParentTripSections.module.css'

function relationId(value: number | TripVariant | null | undefined): number | null {
  return typeof value === 'object' && value ? value.id : value ?? null
}

function locations(variant: TripVariant): Location[] {
  return (variant.locations ?? []).filter((item): item is Location => typeof item === 'object' && item !== null)
}

function dateRange(date: EventDate): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).formatRange(new Date(date.dateFrom), new Date(date.dateTo))
}

function monthHeading(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}-01T00:00:00.000Z`))
}

function price(date: EventDate): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: date.currency, maximumFractionDigits: 0,
  }).format(date.price)
}

export function ParentTripSections({
  eventSlug, variants, dates,
}: {
  eventSlug: string
  variants: TripVariant[]
  dates: EventDate[]
}) {
  const current = dates.filter(date => date.active === true &&
    ['upcoming', 'in-progress'].includes(eventDateLifecycle(date)))
    .sort((left, right) => Date.parse(left.dateFrom) - Date.parse(right.dateFrom) || left.id - right.id)
  const byVariant = new Map<number, EventDate[]>()
  for (const date of current) {
    const id = relationId(date.tripVariant)
    if (id) byVariant.set(id, [...(byVariant.get(id) ?? []), date])
  }
  const activeVariants = variants.filter(variant => variant.active && variant.slug)
  const variantById = new Map(activeVariants.map(variant => [variant.id, variant]))
  const schedule = current.filter(date => variantById.has(relationId(date.tripVariant) ?? -1) && date.publicDateKey)
  const monthKeys = [...new Set(schedule.map(date => date.dateFrom.slice(0, 7)))]

  return (
    <>
      <section id="locations" className={styles.variants} aria-labelledby="trip-locations-title">
        <div className={styles.inner}>
          <div className={styles.header}>
            <p data-eyebrow="section">Explore the trip</p>
            <h2 id="trip-locations-title">Choose your location</h2>
            <p>Explore each location and find the dates that work for you.</p>
          </div>
          <ul className={styles.variantGrid}>
            {activeVariants.map(variant => {
              const places = locations(variant)
              const next = byVariant.get(variant.id)?.find(date => eventDateLifecycle(date) === 'upcoming')
              const image = mediaUrl(places.find(place => mediaUrl(place.mainPicture))?.mainPicture)
              return (
                <li key={variant.id}>
                  <Link className={styles.variantCard} href={tripVariantPath(eventSlug, variant.slug)}>
                    {image && <Image src={image} alt="" fill sizes="(max-width: 700px) 90vw, 30vw" className={styles.variantImage} />}
                    <span className={styles.variantShade} aria-hidden="true" />
                    <span className={styles.variantContent}>
                      <span className={styles.variantMeta}>{places.map(place => place.name).join(' · ') || 'Trip route'}</span>
                      <strong>{variant.title}</strong>
                      <span className={styles.variantFooter}>
                        <span>{next ? `Next date: ${dateRange(next)}` : 'Explore this trip'}</span>
                        <span aria-hidden="true">↗</span>
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section id="dates" className={styles.dates} aria-labelledby="trip-dates-title">
        <div className={styles.inner}>
          <div className={styles.header}>
            <p data-eyebrow="section">Plan your trip</p>
            <h2 id="trip-dates-title">Current &amp; upcoming dates</h2>
            <p>Browse the calendar by month, then open a date to see its full trip details.</p>
          </div>
          {schedule.length ? monthKeys.map(month => (
            <div className={styles.month} key={month}>
              <h3>{monthHeading(month)}</h3>
              <ul className={styles.dateGrid}>
                {schedule.filter(date => date.dateFrom.startsWith(month)).map(date => {
                  const variant = variantById.get(relationId(date.tripVariant) ?? -1)!
                  const datePath = `${tripVariantPath(eventSlug, variant.slug)}?date=${date.publicDateKey}`
                  const canBook = canCheckoutEventDate(date)
                  const underway = eventDateLifecycle(date) === 'in-progress'
                  return (
                    <li key={date.id} className={styles.dateCard}>
                      <p className={styles.dateRange}>{dateRange(date)}{underway && <span> · In progress</span>}</p>
                      <h4>{variant.title}</h4>
                      <p className={styles.datePrice}>{price(date)} <span>per person</span></p>
                      <div className={styles.dateActions}>
                        <Link href={datePath}>View this date <span aria-hidden="true">→</span></Link>
                        {canBook && <Link href={checkoutEntryHref(date.id)}>Book now</Link>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )) : <p className={styles.empty}>No upcoming dates are listed right now. Explore a location or contact us to plan your trip.</p>}
        </div>
      </section>
    </>
  )
}
