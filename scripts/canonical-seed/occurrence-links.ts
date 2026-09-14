import type { CanonicalSeed } from './shared'

export type OccurrencePublicIdentity = { eventSlug: string; occurrenceSlug: string }
export type OccurrenceIdentityMap = Map<string, OccurrencePublicIdentity>

export function occurrenceIdentityMap(seed: CanonicalSeed): OccurrenceIdentityMap {
  const events = new Map(
    (seed.collections.find((entry) => entry.slug === 'events')?.rows ?? [])
      .filter((row) => row.id != null && typeof row.slug === 'string')
      .map((row) => [String(row.id), row.slug as string]),
  )
  return new Map(
    (seed.collections.find((entry) => entry.slug === 'event-dates')?.rows ?? [])
      .filter((row) => row.id != null && typeof row.slug === 'string' && events.has(String(row.event)))
      .map((row) => [String(row.id), {
        eventSlug: events.get(String(row.event))!,
        occurrenceSlug: row.slug as string,
      }]),
  )
}

/** Replace a pre-launch numeric selector with its seed-portable public identity. */
export function remapOccurrenceHref(value: string, identities: OccurrenceIdentityMap): string {
  const match = value.match(/^\/trips\/([^/?#]+)(\?[^#]*)?(#.*)?$/)
  if (!match) return value
  const url = new URL(value, 'https://seed.invalid')
  const sourceID = url.searchParams.get('date')
  if (!sourceID || !/^\d+$/.test(sourceID)) return value
  const identity = identities.get(sourceID)
  if (!identity || identity.eventSlug !== match[1]) return value
  url.searchParams.delete('date')
  const query = url.searchParams.toString()
  return `/trips/${identity.eventSlug}/${identity.occurrenceSlug}${query ? `?${query}` : ''}${url.hash}`
}

export function hasOccurrenceHref(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasOccurrenceHref)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) =>
    key === 'href' && typeof child === 'string'
      ? /^\/trips\/[^?#]+\?/.test(child) && /[?&]date=\d+(?=&|#|$)/.test(child)
      : hasOccurrenceHref(child),
  )
}
