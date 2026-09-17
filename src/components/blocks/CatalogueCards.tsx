import { ArrowRight } from '@/components/ui/ArrowRight'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Event, EventDate, Guide, Location, Post, Program } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { eventCatalogueDescription, eventCatalogueTitle } from '@/lib/event-catalogue-card'
import { tripPublicDatePath } from '@/lib/occurrence-routing'
import { CountryFlag } from './CountryFlag'
import styles from './blocks.module.css'
import effects from '../effects/interaction.module.css'

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
      {eyebrow ? <p data-eyebrow="section" className={styles.eyebrow}>{eyebrow}</p> : null}
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
  href,
  price,
  title,
  image,
  imageAlt,
  className,
}: {
  event: Event
  href?: string
  price?: string | null
  title?: ReactNode
  image?: string | null
  imageAlt?: string
  className?: string
}) {
  const img = image ?? mediaUrl(event.mainPicture)
  const loc = locationLabel(event.locations)
  const cardTitle = title ?? eventCatalogueTitle(event)
  const description = eventCatalogueDescription(event)
  return (
    <Link
      href={href ?? `/trips/${event.slug}`}
      className={[styles.tripCard, className].filter(Boolean).join(' ')}
    >
      <div className={styles.tripMedia}>
        {img ? (
          <Image
            src={img}
            alt={imageAlt ?? mediaAlt(event.mainPicture)}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
      </div>
      <div className={styles.tripContent}>
        {loc ? <p className={styles.cardMeta}>{loc}</p> : null}
        <h3 data-type="subheading">{cardTitle}</h3>
        {description ? <p>{description}</p> : null}
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
      <h3 data-type="subheading">{program.name}</h3>
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

  const isTile = variant === 'countryTiles'
  const content = (
    <>
      <p className={styles.cardMeta}>{place || 'Location'}</p>
      <h3 data-type="subheading">{location.name}</h3>
      {location.country ? <p>{location.country}</p> : null}
      <span className={styles.cardLinkText}>Explore location</span>
    </>
  )

  return (
    <Link
      href={`/destinations/${location.slug}`}
      className={[className ?? styles.domainCard, isTile ? styles.locationTileCard : ''].filter(Boolean).join(' ')}
    >
      {isTile ? (
        <span className={styles.locationCardFlag}>
          <CountryFlag
            country={location.country}
            label={location.country || location.name}
            size="tile"
          />
        </span>
      ) : variant === 'mediaLed' && image ? (
        <span className={styles.locationTileImage} aria-hidden="true">
          <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 25vw" />
        </span>
      ) : null}
      {isTile ? <div className={styles.locationCardContent}>{content}</div> : content}
    </Link>
  )
}

export function CountryLocationCard({
  country,
  locations,
}: {
  country: string
  locations: Location[]
}) {
  const seenDestinations = new Set<string>()
  const destinationNames = locations
    .map((location) => location.name.trim())
    .filter((name) => {
      const key = name.toLocaleLowerCase('en')
      if (seenDestinations.has(key)) return false
      seenDestinations.add(key)
      return true
    })
    .join(', ')
  const anchor = country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <Link
      href={anchor ? `/destinations#${anchor}` : '/destinations'}
      className={`${styles.domainCard} ${styles.locationTileCard}`}
    >
      <span className={styles.locationCardFlag}>
        <CountryFlag
          country={country === 'Beyond' ? null : country}
          label={country}
          size="tile"
        />
      </span>
      <div className={styles.locationCardContent}>
        <h3 data-type="subheading">{country}</h3>
        <p className={styles.countryTileLocations}>{destinationNames}</p>
        <span className={styles.cardLinkText}>Explore destinations</span>
      </div>
    </Link>
  )
}

export function groupLocationsByCountry(locations: Location[], limit?: number | null) {
  const groups = new Map<string, { country: string; locations: Location[] }>()
  for (const location of locations) {
    const country = location.country?.trim() || 'Beyond'
    const key = country.toLocaleLowerCase('en')
    const group = groups.get(key) ?? { country, locations: [] }
    const locationKey = location.name.trim().toLocaleLowerCase('en')
    const isDuplicate = group.locations.some(
      (groupLocation) => groupLocation.name.trim().toLocaleLowerCase('en') === locationKey,
    )
    if (!isDuplicate) group.locations.push(location)
    groups.set(key, group)
  }

  const countryLimit = Math.min(Math.max(limit ?? 8, 1), 24)
  return [...groups.values()]
    .sort((a, b) => {
      if (a.country === 'Beyond') return 1
      if (b.country === 'Beyond') return -1
      if (a.locations.length !== b.locations.length) {
        return b.locations.length - a.locations.length
      }
      return a.country.localeCompare(b.country)
    })
    .slice(0, countryLimit)
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
    <Link href={`/team/${guide.slug}`} className={[className ?? styles.domainCard, effects.imageZoom].join(' ')}>
      {(variant === 'photoOverlay' || variant === 'mediaLed') && image ? (
        <span className={styles.guideCardImage} aria-hidden="true">
          <Image src={image} alt={mediaAlt(guide.photo)} fill sizes="(max-width: 768px) 100vw, 25vw" />
        </span>
      ) : null}
      {guide.role ? <p className={styles.cardMeta}>{guide.role}</p> : null}
      <h3 data-type="subheading">{guide.name}</h3>
      {guide.tagline ? <p>{guide.tagline}</p> : null}
      <span className={`${styles.cardLinkText} ${styles.guideCardLink}`}>
        Meet guide <ArrowRight />
      </span>
    </Link>
  )
}

export function PostCard({ post, className }: { post: Post; className?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={className ?? styles.domainCard}>
      <p className={styles.cardMeta}>{formatPostDate(post.publishedAt)}</p>
      <h3 data-type="subheading">{post.title}</h3>
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
  const href = tripPublicDatePath(event.slug, eventDate)
  return (
    <Link href={href} className={className ?? styles.domainCard}>
      <p className={styles.cardMeta}>{formatDateRange(eventDate.dateFrom, eventDate.dateTo)}</p>
      <h3 data-type="subheading">{event.title}</h3>
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
