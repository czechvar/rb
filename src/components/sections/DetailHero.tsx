import Image from 'next/image'
import type { Event } from '@/payload-types'
import { resolveTripDetail, type TripDetailView } from '@/lib/trip-detail'
import { PricingSidebar } from './PricingSidebar'
import { TagChipStrip, type TagChip } from './TagChipStrip'
import styles from './DetailHero.module.css'

export function DetailHero({
  event,
  trip,
  variant = 'default',
}: {
  event: Event
  trip?: TripDetailView
  variant?: 'default' | 'editorial'
}) {
  const view = trip ?? resolveTripDetail(event, [])
  const mainPic =
    typeof event.mainPicture === 'object' && event.mainPicture ? event.mainPicture : null
  const chips: TagChip[] = view.facts.map((fact) => ({
    icon: fact.label === 'Dates' ? 'calendar' : fact.label === 'Location' ? 'pin' : 'tag',
    label: fact.value,
  }))
  const bookingHref = view.bookingHref ?? 'mailto:info@rockbusters.net'
  const bookingLabel = view.bookingHref ? 'Book Your Spot' : 'Ask a Question'

  return (
    <section className={`${styles.hero} ${variant === 'editorial' ? styles.editorial : ''}`} aria-labelledby="trip-hero-title">
      {mainPic?.url && (
        <Image src={mainPic.url} alt={mainPic.alt || event.title} fill priority className={styles.image} sizes="100vw" />
      )}
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.textCol}>
          {variant === 'editorial' && view.dateLabel && (
            <p data-eyebrow="hero" className={styles.meta}>{view.dateLabel}</p>
          )}
          <h1 id="trip-hero-title" className={styles.title}>{event.title}</h1>
          {event.shortDescription && <p className={styles.lead}>{event.shortDescription}</p>}
          <div className={styles.actions}>
            <a href={bookingHref} className="btn-primary">{bookingLabel}</a>
            <a href={`/trips/${event.slug}/dates`} className="btn-ghost">Dates &amp; Pricing</a>
          </div>
        </div>
        <div className={styles.sidebar}>
          <PricingSidebar
            variant={variant === 'editorial' ? 'dark' : 'default'}
            primaryPrice={view.priceLabel ?? 'Enquire'}
            caption={view.priceLabel ? 'per person' : ''}
            rows={view.facts}
            callout={view.availabilityLabel ?? undefined}
            ctaHref={bookingHref}
            ctaLabel={bookingLabel}
          />
        </div>
      </div>
      {variant === 'default' && chips.length > 0 && <div className={styles.chipStrip}><TagChipStrip chips={chips} /></div>}
    </section>
  )
}
