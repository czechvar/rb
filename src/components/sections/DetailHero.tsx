import Image from 'next/image'
import type { Event } from '@/payload-types'
import { resolveTripDetail, type TripDetailView } from '@/lib/trip-detail'
import { PricingSidebar } from './PricingSidebar'
import { TagChipStrip, type TagChip } from './TagChipStrip'
import styles from './DetailHero.module.css'
import heroStyles from '@/components/blocks/blocks.module.css'

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
  const countries = [...new Set(view.locations.map(location => location.country).filter(Boolean))].join(', ')
  const guides = view.guides.map(guide => guide.name).join(', ')
  const difficulty = view.facts.find(fact => fact.label === 'Difficulty')?.value
  const titleBreak = event.title.indexOf(':')
  const title = variant === 'editorial' && titleBreak >= 0 && event.title.slice(titleBreak + 1).trim()
    ? <>{event.title.slice(0, titleBreak + 1)}<span className={heroStyles.heroAccentWord}>{event.title.slice(titleBreak + 1)}</span></>
    : event.title
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
          {variant === 'editorial' && (view.dateLabel || countries || guides || difficulty) && (
            <div className={styles.meta}>
              {(view.dateLabel || countries) && <p data-eyebrow="hero">{[view.dateLabel, countries].filter(Boolean).join(' · ')}</p>}
              {guides && <p>With <strong>{guides}</strong></p>}
              {difficulty && <p>{difficulty}</p>}
            </div>
          )}
          <h1 id="trip-hero-title" className={styles.title}>{title}</h1>
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
