import type { Page } from '@/payload-types'
import { resolveLocationGridLocations } from '@/lib/block-resolvers/domain-grids'
import { BlockHeader, LocationCard } from './CatalogueCards'
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
