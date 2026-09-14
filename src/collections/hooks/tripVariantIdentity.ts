import { sql } from 'drizzle-orm'
import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import { normalizePublicOccurrenceSlug } from '@/lib/occurrence-routing'

type Relation = number | { id: number } | null | undefined
type Alias = { slug?: string | null }

const relationId = (value: Relation): number | undefined =>
  typeof value === 'object' && value ? value.id : typeof value === 'number' ? value : undefined

const fail = (path: string, message: string): never => {
  throw new ValidationError({ collection: 'trip-variants', errors: [{ path, message }] })
}

export const protectTripVariantIdentity: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const slug = typeof data.slug === 'string' ? normalizePublicOccurrenceSlug(data.slug) : undefined
  if (!slug) fail('slug', 'Trip Variant slug is required.')
  data.slug = slug

  const eventId = relationId(data.event as Relation) ?? relationId(originalDoc?.event as Relation)
  if (eventId == null) fail('event', 'Parent Event is required.')

  const transactionId = await req.transactionID
  const adapter = req.payload.db as unknown as {
    sessions: Record<string, { db: { execute: (query: unknown) => Promise<unknown> } }>
  }
  const db = transactionId && adapter.sessions[String(transactionId)]?.db
  if (!db) throw new Error('Trip Variant identity validation requires an active database transaction.')
  await db.execute(sql`SELECT pg_advisory_xact_lock(42005, ${eventId})`)

  const previousEventId = relationId(originalDoc?.event as Relation)
  if (operation === 'update' && previousEventId != null && previousEventId !== eventId) {
    await db.execute(sql`SELECT pg_advisory_xact_lock(42006, ${originalDoc?.id})`)
    const dates = await req.payload.find({
      collection: 'event-dates',
      where: { tripVariant: { equals: originalDoc?.id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (dates.totalDocs > 0) {
      fail('event', 'A Trip Variant cannot be moved to another Event while Event Dates reference it.')
    }
  }

  const aliases = ((data.slugAliases ?? originalDoc?.slugAliases ?? []) as Alias[])
    .map(({ slug: alias }) =>
      typeof alias === 'string' && alias.trim() ? normalizePublicOccurrenceSlug(alias) : null,
    )
    .filter((alias): alias is string => Boolean(alias) && alias !== slug)
  const previousSlug = typeof originalDoc?.slug === 'string'
    ? normalizePublicOccurrenceSlug(originalDoc.slug)
    : undefined
  if (operation === 'update' && previousSlug && previousSlug !== slug) aliases.push(previousSlug)
  const reserved = [slug, ...new Set(aliases)]
  data.slugAliases = reserved.slice(1).map((alias) => ({ slug: alias }))

  const documentId = operation === 'update' ? originalDoc?.id : undefined
  const conflict = await req.payload.find({
    collection: 'trip-variants',
    where: {
      and: [
        { event: { equals: eventId } },
        ...(documentId != null ? [{ id: { not_equals: documentId } }] : []),
        { or: [{ slug: { in: reserved } }, { 'slugAliases.slug': { in: reserved } }] },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (conflict.totalDocs > 0) {
    fail('slug', 'This slug or one of its aliases is already reserved for the parent Event.')
  }

  return data
}
