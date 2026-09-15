import type { TripVariant } from '@/payload-types'
import { defaultTripLayout } from './trip-layout'
import type { TripDetailView } from './trip-detail'

function hasReadableText(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(hasReadableText)
  const node = value as Record<string, unknown>
  if (typeof node.text === 'string' && node.text.trim()) return true
  return hasReadableText(node.root) || hasReadableText(node.children)
}

/** A parent hub needs its own copy and at least two reviewed location choices. */
export function isIndexableParentTrip(
  eventContent: unknown,
  variants: Array<Pick<TripVariant, 'active' | 'indexable'>>,
): boolean {
  return hasReadableText(eventContent) && variants.filter(variant =>
    variant.active === true && variant.indexable === true).length >= 2
}

/** Use registered trip blocks while keeping date-specific facts off the Event hub. */
export function parentTripLayout(trip: TripDetailView) {
  const blocks = parentSafeBlocks(defaultTripLayout(trip))
  return {
    lead: blocks.filter(block => block.blockType === 'tripHero'),
    body: blocks.filter(block => block.blockType !== 'tripHero'),
  }
}

/** The hub owns one date schedule; authored layouts can keep their evergreen blocks. */
export function parentSafeBlocks<T extends { blockType: string }>(blocks: T[]): T[] {
  return blocks.filter(block => ![
    'tripFacts', 'tripDates', 'tripVenue', 'tripBookingCTA', 'calendar',
  ].includes(block.blockType))
}
