import Image from 'next/image'
import Link from 'next/link'
import type { Event, EventDate, Guide, Location, Media, Post, Program } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import styles from './blocks.module.css'

export type FeaturedCardVariant = 'card' | 'feature' | 'compact' | 'mediaLed'

export function BlockHeader({
  eyebrow,
  heading,
  intro,
}: {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
}) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <div className={styles.sectionHeader}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className={styles.lead}>{intro}</p> : null}
    </div>
  )
}

export function featuredSectionClassName(variant?: string | null) {
  return [
    styles.domainGridSection,
    variant === 'feature' ? styles.featuredCatalogueSection : '',
    variant === 'mediaLed' ? styles.featuredCatalogueMediaLedSection : '',
  ].filter(Boolean).join(' ')
}

export function featuredCardClassName(variant?: string | null) {
  return [
    styles.featuredCatalogueCard,
    variant === 'feature' ? styles.featuredCatalogueFeature : '',
    variant === 'compact' ? styles.featuredCatalogueCompact : '',
    variant === 'mediaLed' ? styles.featuredCatalogueMediaLed : '',
  ].filter(Boolean).join(' ')
}

export function TripCard({
  event,
  price,
  lead,
  className,
}: {
  event: Event
  price?: string | null
  lead?: boolean
  className?: string
}) {
  const img = mediaUrl(event.mainPicture)
  const loc = locationLabel(event.locations)
  return (
    <Link
      href={`/trips/${event.slug}`}
      className={[styles.tripCard, className, lead ? styles.tripCardLead : ''].filter(Boolean).join(' ')}
    >
      <div className={styles.tripMedia}>
        {img ? (
          <Image
            src={img}
            alt={mediaAlt(event.mainPicture as number | Media)}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
      </div>
      <div className={styles.tripContent}>
        {loc ? <p className={styles.cardMeta}>{loc}</p> : null}
        <h3>{event.title}</h3>
        {event.shortDescription ? <p>{event.shortDescription}</p> : null}
        <div className={styles.tripFooter}>
          {price ? <span>{price}</span> : <span>Upcoming dates</span>}
          <span aria-hidden="true">-&gt;</span>
        </div>
      </div>
    </Link>
  )
}

export function ProgramCard({ program, className }: { program: Program; className?: string }) {
  return (
    <Link href={`/programs/${program.slug}`} className={className ?? styles.domainCard}>
      <p className={styles.cardMeta}>Program</p>
      <h3>{program.name}</h3>
      {program.shortDescription ? <p>{program.shortDescription}</p> : null}
      <span className={styles.cardLinkText}>Explore program</span>
    </Link>
  )
}

export function LocationCard({
  location,
  variant,
  className,
}: {
  location: Location
  variant?: string | null
  className?: string
}) {
  const place = [location.city, location.country].filter(Boolean).join(', ')
  const image = mediaUrl(location.mainPicture)

  return (
    <Link href={`/destinations/${location.slug}`} className={className ?? styles.domainCard}>
      {(variant === 'countryTiles' || variant === 'mediaLed') && image ? (
        <span className={styles.locationTileImage} aria-hidden="true">
          <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 25vw" />
        </span>
      ) : null}
      {variant === 'countryTiles' && location.country ? (
        <span className={styles.locationCountryMark}>{countryCode(location.country)}</span>
      ) : null}
      <p className={styles.cardMeta}>{place || 'Location'}</p>
      <h3>{location.name}</h3>
      {location.country ? <p>{location.country}</p> : null}
      <span className={styles.cardLinkText}>Explore location</span>
    </Link>
  )
}

export function GuideCard({
  guide,
  variant,
  className,
}: {
  guide: Guide
  variant?: string | null
  className?: string
}) {
  const image = mediaUrl(guide.photo)
  return (
    <Link href={`/team/${guide.slug}`} className={className ?? styles.domainCard}>
      {(variant === 'photoOverlay' || variant === 'mediaLed') && image ? (
        <span className={styles.guideCardImage} aria-hidden="true">
          <Image src={image} alt={mediaAlt(guide.photo)} fill sizes="(max-width: 768px) 100vw, 25vw" />
        </span>
      ) : null}
      {guide.role ? <p className={styles.cardMeta}>{guide.role}</p> : null}
      <h3>{guide.name}</h3>
      {guide.tagline ? <p>{guide.tagline}</p> : null}
      <span className={styles.cardLinkText}>Meet guide</span>
    </Link>
  )
}

export function PostCard({ post, className }: { post: Post; className?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={className ?? styles.domainCard}>
      <p className={styles.cardMeta}>{formatPostDate(post.publishedAt)}</p>
      <h3>{post.title}</h3>
      {post.excerpt ? <p>{post.excerpt}</p> : null}
      <span className={styles.cardLinkText}>Read post</span>
    </Link>
  )
}

export function EventDateCard({
  eventDate,
  className,
}: {
  eventDate: EventDate
  className?: string
}) {
  const event = eventDate.event as Event
  return (
    <Link href={`/trips/${event.slug}`} className={className ?? styles.domainCard}>
      <p className={styles.cardMeta}>{formatDateRange(eventDate.dateFrom, eventDate.dateTo)}</p>
      <h3>{event.title}</h3>
      <p>
        {eventDate.currency} {eventDate.price}
        {typeof eventDate.capacity === 'number' ? ` · ${eventDate.capacity} seats` : ''}
      </p>
      <span className={styles.cardLinkText}>View trip</span>
    </Link>
  )
}

function locationLabel(locations: Event['locations']): string | null {
  const first = locations?.[0]
  return typeof first === 'object' && first ? (first as Location).name : null
}

function countryCode(country: string) {
  return country.trim().slice(0, 2).toUpperCase()
}

function formatPostDate(value: string | null | undefined) {
  if (!value) return 'Post'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  )
}

function formatDateRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
  return `${formatter.format(new Date(from))} - ${formatter.format(new Date(to))}`
}
