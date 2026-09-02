import Image from 'next/image'
import Link from 'next/link'
import type { Where } from 'payload'
import type { Location, Page } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { BlockHeader } from './CatalogueCards'
import styles from './blocks.module.css'

type DestinationCountryIndexBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'destinationCountryIndex' }
>

type CountryGroup = {
  country: string
  anchor: string
  code: string | null
  locations: Location[]
}

const countryCodes: Record<string, string> = {
  austria: 'at',
  balkans: '',
  croatia: 'hr',
  'czech republic': 'cz',
  czechia: 'cz',
  elsewhere: '',
  france: 'fr',
  germany: 'de',
  greece: 'gr',
  italy: 'it',
  malta: 'mt',
  norway: 'no',
  slovakia: 'sk',
  slovenia: 'si',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  turkey: 'tr',
}

export async function DestinationCountryIndexBlock({
  eyebrow,
  heading,
  intro,
  showJumpBar = true,
  source,
  variant,
}: DestinationCountryIndexBlockProps) {
  const groups = await getCountryGroups(source)
  if (!groups.length) return null

  return (
    <section className={styles.destinationCountryIndex}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
      </div>
      {showJumpBar ? (
        <nav className={styles.destinationJumpBar} aria-label="Destination countries">
          {groups.map((group) => (
            <a key={group.country} href={`#${group.anchor}`} className={styles.destinationJumpPill}>
              <CountryFlag code={group.code} label={group.country} compact />
              <span>{group.country}</span>
            </a>
          ))}
        </nav>
      ) : null}
      {groups.map((group) => (
        <section key={group.country} className={styles.destinationCountrySection} id={group.anchor}>
          <div className={styles.sectionInner}>
            <div className={styles.destinationCountryHead}>
              <CountryFlag code={group.code} label={group.country} />
              <h2>{group.country}</h2>
              <span>
                {group.locations.length} {group.locations.length === 1 ? 'destination' : 'destinations'}
              </span>
            </div>
            <div className={styles.destinationCountryGrid}>
              {group.locations.map((location) => (
                <DestinationCard key={location.id} location={location} variant={variant} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </section>
  )
}

async function getCountryGroups(
  source: DestinationCountryIndexBlockProps['source'],
): Promise<CountryGroup[]> {
  const payload = await getPayloadClient()
  const whereClauses: Where[] = [{ active: { equals: true } }]
  if (source === 'featured') whereClauses.push({ featured: { equals: true } })

  const { docs } = await payload.find({
    collection: 'locations',
    where: { and: whereClauses },
    sort: 'country,name',
    depth: 1,
    limit: 200,
  })

  const byCountry = new Map<string, Location[]>()
  for (const location of docs) {
    const country = location.country?.trim() || 'Elsewhere'
    byCountry.set(country, [...(byCountry.get(country) ?? []), location])
  }

  return [...byCountry.entries()]
    .sort(([countryA, locationsA], [countryB, locationsB]) => {
      const countDelta = locationsB.length - locationsA.length
      if (countDelta !== 0) return countDelta
      return countryA.localeCompare(countryB)
    })
    .map(([country, locations]) => ({
      country,
      anchor: countryAnchor(country),
      code: countryCodes[country.toLowerCase()] ?? null,
      locations: locations.sort((a, b) => a.name.localeCompare(b.name)),
    }))
}

function DestinationCard({
  location,
  variant,
}: {
  location: Location
  variant?: string | null
}) {
  const image = mediaUrl(location.mainPicture)
  const useImage = variant === 'photoCards' && image
  const teaser = destinationTeaser(location)

  return (
    <Link
      href={`/destinations/${location.slug}`}
      className={[
        styles.destinationCard,
        useImage ? styles.destinationCardPhoto : '',
      ].filter(Boolean).join(' ')}
    >
      {useImage ? (
        <Image
          src={image}
          alt={mediaAlt(location.mainPicture)}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      ) : null}
      <span className={styles.destinationCardOverlay} aria-hidden="true" />
      <span className={styles.destinationCardFlag}>
        <CountryFlag code={countryCodes[(location.country ?? '').toLowerCase()] ?? null} label={location.country ?? location.name} compact />
      </span>
      <strong>{location.name}</strong>
      {teaser ? <span className={styles.destinationCardTeaser}>{teaser}</span> : null}
      <span className={styles.destinationCardLink}>View destination</span>
    </Link>
  )
}

function CountryFlag({
  code,
  compact,
  label,
}: {
  code: string | null
  compact?: boolean
  label: string
}) {
  if (!code) return <span className={compact ? styles.flagFallbackCompact : styles.flagFallback} />

  const width = compact ? 40 : 80
  return (
    <span
      aria-label={`${label} flag`}
      role="img"
      className={compact ? styles.destinationFlagCompact : styles.destinationFlag}
      style={{ backgroundImage: `url(https://flagcdn.com/w${width}/${code}.png)` }}
    />
  )
}

function countryAnchor(country: string) {
  return country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'elsewhere'
}

function destinationTeaser(location: Location) {
  const candidates = [
    location.seasonSummary,
    location.transportSummary,
    location.accommodationSummary,
    ...(location.contentSections ?? []).map((section) => section.body),
  ]

  const value = candidates
    .find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
    ?.trim()
    .replace(/\s+/g, ' ')

  if (!value) return location.country ? `Climbing destination in ${location.country}.` : null
  if (value.length <= 118) return value
  return `${value.slice(0, 115).trim()}...`
}
