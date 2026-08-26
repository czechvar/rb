import Image from 'next/image'
import Link from 'next/link'
import type { Location, Page } from '@/payload-types'
import { resolveLocationGridLocations } from '@/lib/block-resolvers/domain-grids'
import { mediaUrl } from '@/lib/media'
import styles from './blocks.module.css'

type LocationGridBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'locationGrid' }
>

export async function LocationGridBlock({
  country,
  eyebrow,
  heading,
  intro,
  limit,
  locations,
  source,
  variant,
}: LocationGridBlockProps) {
  const items = await resolveLocationGridLocations({ source, locations, country, limit })
  if (!items.length) return null

  return (
    <section className={sectionClassName(variant)}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((location) => (
            <LocationCard key={location.id} location={location} variant={variant} />
          ))}
        </div>
      </div>
    </section>
  )
}

function LocationCard({ location, variant }: { location: Location, variant?: string | null }) {
  const place = [location.city, location.country].filter(Boolean).join(', ')
  const image = mediaUrl(location.mainPicture)

  return (
    <Link href={`/destinations/${location.slug}`} className={styles.domainCard}>
      {variant === 'countryTiles' && image ? (
        <span className={styles.locationTileImage} aria-hidden="true">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
          />
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

function BlockHeader({
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

function gridClassName(variant?: string | null) {
  return [
    styles.domainGrid,
    variant === 'compact' ? styles.domainGridCompact : '',
    variant === 'countryTiles' ? styles.locationTileGrid : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function sectionClassName(variant?: string | null) {
  return [
    styles.domainGridSection,
    variant === 'countryTiles' ? styles.locationTilesSection : '',
  ].filter(Boolean).join(' ')
}

function countryCode(country: string) {
  return country.trim().slice(0, 2).toUpperCase()
}
