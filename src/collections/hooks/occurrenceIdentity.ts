import { ValidationError, type CollectionBeforeChangeHook, type FieldHook } from 'payload'
import { sql } from 'drizzle-orm'
import { deriveOccurrenceSlug, derivePublicDateKey, normalizeOccurrenceSlug, normalizePublicOccurrenceSlug } from '@/lib/occurrence-routing'

type Relation = number | { id: number; slug?: string } | null | undefined
type Alias = { slug?: string | null; id?: string | null }

function relationId(value: Relation): number | undefined {
  return typeof value === 'object' && value ? value.id : typeof value === 'number' ? value : undefined
}

function validation(path: string, message: string, collection = 'event-dates'): never {
  throw new ValidationError({ collection, errors: [{ path, message }] })
}

async function lockParentOccurrenceIdentities(
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  eventId: number,
): Promise<void> {
  const transactionId = await req.transactionID
  const adapter = req.payload.db as unknown as {
    sessions: Record<string, { db: { execute: (query: unknown) => Promise<unknown> } }>
  }
  const db = transactionId && adapter.sessions[String(transactionId)]?.db
  if (!db) throw new Error('Occurrence identity validation requires an active database transaction.')
  await db.execute(sql`SELECT pg_advisory_xact_lock(42004, ${eventId})`)
}

async function lockTripVariantDateKeys(
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  tripVariantId: number,
): Promise<void> {
  const transactionId = await req.transactionID
  const adapter = req.payload.db as unknown as {
    sessions: Record<string, { db: { execute: (query: unknown) => Promise<unknown> } }>
  }
  const db = transactionId && adapter.sessions[String(transactionId)]?.db
  if (!db) throw new Error('Public date key validation requires an active database transaction.')
  await db.execute(sql`SELECT pg_advisory_xact_lock(42006, ${tripVariantId})`)
}

export const deriveStoredOccurrenceSlug: FieldHook = async ({ value, data, originalDoc, req }) => {
  if (typeof value === 'string' && value.trim()) return normalizePublicOccurrenceSlug(value)
  if (typeof originalDoc?.slug === 'string' && originalDoc.slug) return originalDoc.slug

  const locations = (data?.locations ?? originalDoc?.locations ?? []) as Relation[]
  if (locations.length !== 1) {
    validation(
      'slug',
      'Enter an occurrence slug explicitly when there is not exactly one selected Location.',
    )
  }

  const selected = locations[0]
  let locationSlug = typeof selected === 'object' && selected ? selected.slug : undefined
  if (!locationSlug) {
    const id = relationId(selected)
    if (id == null) validation('locations', 'Select one Location or enter an occurrence slug explicitly.')
    const location = await req.payload.findByID({
      collection: 'locations',
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })
    locationSlug = location.slug
  }

  const dateFrom = data?.dateFrom ?? originalDoc?.dateFrom
  if (typeof dateFrom !== 'string') validation('dateFrom', 'Enter a valid start date before generating the occurrence slug.')
  return deriveOccurrenceSlug(locationSlug, dateFrom)
}

export const protectOccurrenceIdentity: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const slug = typeof data.slug === 'string' ? normalizePublicOccurrenceSlug(data.slug) : undefined
  if (!slug) validation('slug', 'Occurrence slug is required.')
  data.slug = slug

  const eventId = relationId(data.event as Relation) ?? relationId(originalDoc?.event as Relation)
  if (eventId == null) validation('event', 'Parent Event is required.')
  await lockParentOccurrenceIdentities(req, eventId)

  const tripVariantValue = (Object.prototype.hasOwnProperty.call(data, 'tripVariant')
    ? data.tripVariant
    : originalDoc?.tripVariant) as Relation
  const tripVariantId = relationId(tripVariantValue)
  if (tripVariantId != null) {
    await lockTripVariantDateKeys(req, tripVariantId)
    const tripVariant = typeof tripVariantValue === 'object' && tripVariantValue && 'event' in tripVariantValue
      ? tripVariantValue as unknown as { event: Relation }
      : await req.payload.findByID({
          collection: 'trip-variants',
          id: tripVariantId,
          depth: 0,
          overrideAccess: true,
          req,
        })
    if (relationId(tripVariant.event as Relation) !== eventId) {
      validation('tripVariant', 'Trip Variant must belong to the same Event as this Event Date.')
    }
    const dateFrom = data.dateFrom ?? originalDoc?.dateFrom
    const dateTo = data.dateTo ?? originalDoc?.dateTo
    if (typeof dateFrom !== 'string' || typeof dateTo !== 'string') {
      validation('publicDateKey', 'Valid start and end dates are required to derive the public date key.')
    }
    const publicDateKey = derivePublicDateKey(dateFrom, dateTo)
    data.publicDateKey = publicDateKey
    const dateKeyConflict = await req.payload.find({
      collection: 'event-dates',
      where: {
        and: [
          { tripVariant: { equals: tripVariantId } },
          { publicDateKey: { equals: publicDateKey } },
          ...(operation === 'update' && originalDoc?.id != null
            ? [{ id: { not_equals: originalDoc.id } }]
            : []),
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (dateKeyConflict.totalDocs > 0) {
      validation('publicDateKey', 'This date range is already used by the selected Trip Variant.')
    }
  } else {
    data.publicDateKey = null
  }

  const previousEventId = relationId(originalDoc?.event as Relation)
  if (operation === 'update' && previousEventId != null && previousEventId !== eventId) {
    validation('event', 'A dated occurrence cannot be moved to another Event after its public identity is stored.')
  }

  const aliases = ((data.slugAliases ?? originalDoc?.slugAliases ?? []) as Alias[])
    .map((item) => (typeof item?.slug === 'string' && item.slug.trim() ? normalizePublicOccurrenceSlug(item.slug) : null))
    .filter((item): item is string => Boolean(item) && item !== slug)
  const previousSlug = typeof originalDoc?.slug === 'string' ? normalizeOccurrenceSlug(originalDoc.slug) : undefined
  if (operation === 'update' && previousSlug && previousSlug !== slug) aliases.push(previousSlug)
  const uniqueAliases = [...new Set(aliases)]
  data.slugAliases = uniqueAliases.map((alias) => ({ slug: alias }))

  const reserved = [slug, ...uniqueAliases]
  const documentId = operation === 'update' ? originalDoc?.id : undefined
  const conflict = await req.payload.find({
    collection: 'event-dates',
    where: {
      and: [
        { event: { equals: eventId } },
        ...(documentId != null ? [{ id: { not_equals: documentId } }] : []),
        {
          or: [
            { slug: { in: reserved } },
            { 'slugAliases.slug': { in: reserved } },
          ],
        },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (conflict.totalDocs > 0) {
    validation('slug', 'This occurrence slug or one of its aliases is already reserved for the parent Event.')
  }

  return data
}

export const freezePublishedEventSlug: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  const nextSlug = data.slug ?? originalDoc?.slug
  if (operation !== 'update' || !originalDoc?.slug || nextSlug === originalDoc.slug) return data
  if (originalDoc.state !== 'published') return data
  const occurrences = await req.payload.find({
    collection: 'event-dates',
    where: { event: { equals: originalDoc.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (occurrences.totalDocs > 0) {
    validation(
      'slug',
      'Published Event slugs with dated occurrences are frozen until the old parent paths can be preserved.',
      'events',
    )
  }
  return data
}
