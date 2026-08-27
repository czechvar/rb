import Image from 'next/image'
import type { Location } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getPublishedEventsForLocation } from '@/lib/queries'
import { LocationBlock } from '@/components/sections/LocationBlock'
import { LinkedEvents } from '@/components/sections/LinkedEvents'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type LocationContextBlock = Record<string, unknown>

export function LocationHeroBlock(_block: LocationContextBlock, { location }: BlockRenderContext) {
  if (!isLocation(location)) return null

  const hero = mediaUrl(location.mainPicture)
  const place = [location.city, location.country].filter(Boolean).join(', ')

  return (
    <section className={styles.locationHero}>
      {hero ? (
        <Image
          src={hero}
          alt={mediaAlt(location.mainPicture) || location.name}
          fill
          priority
          sizes="100vw"
          className={styles.locationHeroImage}
        />
      ) : null}
      <div className={styles.locationHeroOverlay} />
      <div className={styles.locationHeroInner}>
        {place ? <p className={styles.eyebrow}>{place}</p> : null}
        <h1>{location.name}</h1>
      </div>
    </section>
  )
}

export function LocationContentBlock(
  block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null

  return (
    <LocationBlock
      content={location.content}
      heading={typeof block.heading === 'string' ? block.heading : location.name}
      eyebrow={typeof block.eyebrow === 'string' ? block.eyebrow : location.country ?? undefined}
      image={location.mainPicture}
      imageAlt={location.name}
    />
  )
}

export function LocationMapBlock(block: LocationContextBlock, { location }: BlockRenderContext) {
  if (!isLocation(location)) return null

  const [lng, lat] = location.coordinates ?? [null, null]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null

  const heading = typeof block.heading === 'string' ? block.heading : 'Where it is'

  return (
    <section className={styles.locationMapSection}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>{location.country}</p>
          <h2>{heading}</h2>
        </div>
        <div className={styles.locationMapFrame}>
          <iframe
            src={osmEmbedSrc(lng, lat)}
            title={`Map of ${location.name}`}
            loading="lazy"
          />
          <div className={styles.locationMapLabel}>
            <strong>{location.name}</strong>
            <span>{formatCoordinate(lat, 'N', 'S')} / {formatCoordinate(lng, 'E', 'W')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export async function LocationTripsBlock(
  _block: LocationContextBlock,
  { location }: BlockRenderContext,
) {
  if (!isLocation(location)) return null

  const events = await getPublishedEventsForLocation(location.id)
  return <LinkedEvents events={events} />
}

function osmEmbedSrc(lng: number, lat: number) {
  const bbox = [lng - 0.05, lat - 0.03, lng + 0.05, lat + 0.03].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

function formatCoordinate(value: number, positive: string, negative: string) {
  const direction = value >= 0 ? positive : negative
  return `${Math.abs(value).toFixed(2)}° ${direction}`
}

function isLocation(location: BlockRenderContext['location']): location is Location {
  return typeof location === 'object' && location !== null
}
