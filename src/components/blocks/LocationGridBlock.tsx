import Link from 'next/link'
import type { Location, Page } from '@/payload-types'
import { resolveLocationGridLocations } from '@/lib/block-resolvers/domain-grids'
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
    <section className={styles.domainGridSection}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      </div>
    </section>
  )
}

function LocationCard({ location }: { location: Location }) {
  const place = [location.city, location.country].filter(Boolean).join(', ')

  return (
    <Link href={`/destinations/${location.slug}`} className={styles.domainCard}>
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
  return [styles.domainGrid, variant === 'compact' ? styles.domainGridCompact : '']
    .filter(Boolean)
    .join(' ')
}
