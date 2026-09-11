import { HeadingText } from '@/components/ui/EditorialHeading'
import Image from 'next/image'
import type { Event } from '@/payload-types'
import { resolveTripDetail, type TripDetailView } from '@/lib/trip-detail'
import { tripSummary } from '@/lib/trip-summary'
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
  event = view.event
  const editorial = view.editorial?.hero
  const heroDate = view.selectedDate
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).formatRange(new Date(view.selectedDate.dateFrom), new Date(view.selectedDate.dateTo))
    : view.dateLabel
  const summary = variant === 'editorial' ? tripSummary(view) : null
  const mainPic =
    typeof event.mainPicture === 'object' && event.mainPicture ? event.mainPicture : null
  const chips: TagChip[] = view.facts.map((fact) => ({
    icon: fact.label === 'Dates' ? 'calendar' : fact.label === 'Location' ? 'pin' : 'tag',
    label: fact.value,
  }))
  const places = [
    ...new Set(
      view.locations.map((location) =>
        [location.name, location.country].filter(Boolean).join(', '),
      ),
    ),
  ].join(' · ')
  // The content-parity pass retained standalone hashtag paragraphs in additionalInfo.
  const hashtags = editorial?.clearHashtag
    ? []
    : editorial?.hashtag
      ? [editorial.hashtag]
      : event.tripDetail?.hashtag
        ? [event.tripDetail.hashtag]
        : [
            ...new Set(
              (event.additionalInfo ?? []).flatMap((info) =>
                (info.body?.root.children ?? []).flatMap((node) => {
                  if (node.type !== 'paragraph' || !Array.isArray(node.children)) return []
                  const text = node.children
                    .map((child) => (typeof child.text === 'string' ? child.text : ''))
                    .join('')
                    .trim()
                  return /^#[\p{L}\p{N}_]+$/u.test(text) ? [text] : []
                }),
              ),
            ),
          ]
  const guides = view.guides.map((guide) => guide.name).join(', ')
  const difficulty =
    event.tripDetail?.leadRequirement ??
    view.facts.find((fact) => fact.label === 'Difficulty')?.value
  const titleBreak = event.title.indexOf(':')
  const title = editorial?.titleParts?.length ? (
    <HeadingText parts={editorial.titleParts} />
  ) : variant === 'editorial' && titleBreak >= 0 && event.title.slice(titleBreak + 1).trim() ? (
    <>
      {event.title.slice(0, titleBreak + 1)}
      <span className={heroStyles.heroAccentWord}>{event.title.slice(titleBreak + 1)}</span>
    </>
  ) : (
    event.title
  )
  const bookingHref = view.bookingHref ?? 'mailto:info@rockbusters.net'
  const bookingLabel = view.bookingHref
    ? editorial?.primaryLabel || 'Book Your Spot'
    : 'Ask a Question'

  const pricing = (
    <PricingSidebar
      variant={variant === 'editorial' ? 'dark' : 'default'}
      primaryPrice={summary?.primaryPrice ?? view.priceLabel ?? 'Enquire'}
      secondaryPrice={summary?.secondaryPrice}
      caption={summary?.caption ?? (view.priceLabel ? 'per person' : '')}
      rows={summary?.rows ?? view.facts}
      callout={summary?.callout ?? view.availabilityLabel ?? undefined}
      ctaHref={bookingHref}
      ctaLabel={view.bookingHref ? 'Book Your Spot' : bookingLabel}
    />
  )

  return (
    <div
      data-event-date-id={view.selectedDate?.id}
      className={`${styles.heroFrame} ${variant === 'editorial' ? styles.editorialFrame : ''}`}
    >
      <section
        className={`${styles.hero} ${variant === 'editorial' ? styles.editorial : ''}`}
        aria-labelledby="trip-hero-title"
      >
        {mainPic?.url && (
          <Image
            src={mainPic.url}
            alt={mainPic.alt || event.title}
            fill
            priority
            className={styles.image}
            sizes="100vw"
          />
        )}
        <div className={styles.overlay} />
        <div className={styles.content}>
          {variant === 'editorial' && (view.dateLabel || places || guides || difficulty) && (
            <div className={styles.meta}>
              {(heroDate || places) && (
                <p data-eyebrow="hero">
                  <span>
                    {heroDate && <strong>{heroDate}</strong>}
                    {heroDate && places && ' · '}
                    {places}
                  </span>
                </p>
              )}
              {guides && (
                <p>
                  With <strong>{guides}</strong>
                </p>
              )}
              {difficulty && <p>{difficulty}</p>}
            </div>
          )}
          <div className={styles.textCol}>
            <h1 id="trip-hero-title" className={styles.title}>
              {title}
            </h1>
            {(editorial?.description || event.shortDescription) && (
              <p className={styles.lead}>{editorial?.description || event.shortDescription}</p>
            )}
            {variant === 'editorial' && hashtags.length > 0 && (
              <p className={styles.hashtags}>{hashtags.join(' ')}</p>
            )}
            <div className={styles.actions}>
              <a href={bookingHref} className="btn-primary">
                {bookingLabel}
              </a>
              <a
                href={
                  editorial?.secondaryTarget === 'programme'
                    ? '#itinerary'
                    : `/trips/${event.slug}/dates`
                }
                className="btn-ghost"
              >
                {editorial?.secondaryLabel || 'Dates & Pricing'}
              </a>
            </div>
          </div>
          {variant !== 'editorial' && <div className={styles.sidebar}>{pricing}</div>}
        </div>
        {variant === 'default' && chips.length > 0 && (
          <div className={styles.chipStrip}>
            <TagChipStrip chips={chips} />
          </div>
        )}
      </section>
      {variant === 'editorial' && <div className={styles.editorialSummary}>{pricing}</div>}
    </div>
  )
}
