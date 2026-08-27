import { getPayloadClient } from '@/lib/payload'
import type { Where } from 'payload'
import type { Faq } from '@/payload-types'
import { relationId, relationIds } from './helpers'

export type FAQSource = 'global' | 'manual' | 'inline' | 'byEvent' | 'byProgram'

export type FAQResolverInput = {
  source?: FAQSource | null
  faqs?: Array<number | Faq> | null
  event?: number | { id: number } | null
  program?: number | { id: number } | null
  limit?: number | null
}

export async function resolveFAQs(input: FAQResolverInput): Promise<Faq[]> {
  const payload = await getPayloadClient()
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 20)
  const source = input.source ?? 'global'

  if (source === 'manual') {
    const expanded = (input.faqs ?? []).filter(
      (faq): faq is Faq => typeof faq === 'object' && faq.active === true,
    )
    if (expanded.length > 0) return expanded.slice(0, limit)

    const ids = relationIds(input.faqs)
    if (ids.length === 0) return []

    const { docs } = await payload.find({
      collection: 'faqs',
      where: {
        and: [{ id: { in: ids } }, { active: { equals: true } }],
      },
      sort: 'position',
      limit,
    })
    return docs
  }

  const whereClauses: Where[] = [{ active: { equals: true } }]

  if (source === 'global') {
    whereClauses.push({ event: { exists: false } }, { program: { exists: false } })
  }

  if (source === 'byEvent') {
    const eventId = relationId(input.event)
    if (!eventId) return []
    whereClauses.push({ event: { equals: eventId } })
  }

  if (source === 'byProgram') {
    const programId = relationId(input.program)
    if (!programId) return []
    whereClauses.push({ program: { equals: programId } })
  }

  const { docs } = await payload.find({
    collection: 'faqs',
    where: { and: whereClauses },
    sort: 'position',
    limit,
  })
  return docs
}
