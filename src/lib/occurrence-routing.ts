import { slugify } from '@/fields/slug'

const PUBLIC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RESERVED_OCCURRENCE_SLUGS = new Set(['dates', 'faq', 'logistics'])

export function normalizeOccurrenceSlug(value: string): string {
  const slug = slugify(value)
  if (!slug || !PUBLIC_SLUG.test(slug)) throw new Error('Occurrence slug must contain letters or numbers.')
  return slug
}

export function normalizePublicOccurrenceSlug(value: string): string {
  const slug = normalizeOccurrenceSlug(value)
  if (RESERVED_OCCURRENCE_SLUGS.has(slug)) {
    throw new Error(`Occurrence slug "${slug}" is reserved by a trip subroute.`)
  }
  return slug
}

export function utcCalendarDate(value: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error('Occurrence start date must be valid.')
  return new Date(timestamp).toISOString().slice(0, 10)
}

export function deriveOccurrenceSlug(locationSlug: string, dateFrom: string): string {
  return normalizePublicOccurrenceSlug(`${normalizeOccurrenceSlug(locationSlug)}-${utcCalendarDate(dateFrom)}`)
}

export function tripOccurrencePath(eventSlug: string, occurrenceSlug: string): string {
  const parent = normalizeOccurrenceSlug(eventSlug)
  const occurrence = normalizePublicOccurrenceSlug(occurrenceSlug)
  return `/trips/${parent}/${occurrence}`
}
