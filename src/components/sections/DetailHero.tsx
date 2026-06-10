import Image from 'next/image'
import type { Event } from '@/payload-types'
import { PricingSidebar } from './PricingSidebar'
import { TagChipStrip, type TagChip } from './TagChipStrip'
import styles from './DetailHero.module.css'

// TODO (data-wiring round): replace with per-event Payload fields.
// See: docs/superpowers/specs/2026-06-01-trip-detail-figma-r3-hero-design.md (Out of scope).
const HARDCODED_CHIPS: TagChip[] = [
  { icon: 'pin', label: 'RODELLAR, ARAGON, SPAIN' },
  { icon: 'tag', label: 'SPORT CLIMBING' },
  { icon: 'mountain', label: 'OUTDOOR LEAD 6b-8a' },
  { icon: 'calendar', label: 'MAY 2026' },
  { icon: 'gift', label: 'EVOLV & SINGING ROCK CLIMBING GEAR DEMO' },
]

// TODO (data-wiring round): replace with per-event Payload fields.
// See: docs/superpowers/specs/2026-06-01-trip-detail-figma-r3-hero-design.md (Out of scope).
const HARDCODED_SIDEBAR = {
  primaryPrice: '€ 950 / 1 week',
  secondaryPrice: '€ 1,650 for 2 weeks',
  caption: 'per person · coaching included',
  rows: [
    { label: 'Dates', value: 'May 2026/2027 – see below' },
    { label: 'Duration', value: '1 week / 2 weeks' },
    { label: 'Location', value: 'Rodellar, Aragon, Spain' },
    { label: 'Level', value: 'Outdoor lead 6b-8a' },
    { label: 'Coaches', value: 'Klemen Bečan, Jany Novotny, Pablo Ruiz Seco' },
  ],
  callout: 'Free demo of Evolv & Singing Rock climbing equipment',
  ctaLabel: 'BOOK YOUR SPOT →',
} as const

export function DetailHero({
  event,
}: {
  event: Event
}) {
  const mainPic =
    typeof event.mainPicture === 'object' && event.mainPicture ? event.mainPicture : null

  return (
    <section className={styles.hero} aria-labelledby="trip-hero-title">
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
        <div className={styles.text}>
          <h1 id="trip-hero-title" className={styles.title}>{event.title}</h1>
          {event.shortDescription && (
            <p className={styles.lead}>{event.shortDescription}</p>
          )}
        </div>
        <div className={styles.sidebar}>
          <PricingSidebar
            primaryPrice={HARDCODED_SIDEBAR.primaryPrice}
            secondaryPrice={HARDCODED_SIDEBAR.secondaryPrice}
            caption={HARDCODED_SIDEBAR.caption}
            rows={[...HARDCODED_SIDEBAR.rows]}
            callout={HARDCODED_SIDEBAR.callout}
            ctaHref="#dates"
            ctaLabel={HARDCODED_SIDEBAR.ctaLabel}
          />
        </div>
      </div>
      <div className={styles.chipStrip}>
        <TagChipStrip chips={HARDCODED_CHIPS} />
      </div>
    </section>
  )
}
