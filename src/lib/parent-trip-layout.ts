import type { TripVariant } from '@/payload-types'
import legacyRedirectDecisions from './legacy-redirect-decisions.json'
import { defaultTripLayout } from './trip-layout'
import type { TripDetailView } from './trip-detail'

function hasReadableText(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(hasReadableText)
  const node = value as Record<string, unknown>
  if (typeof node.text === 'string' && node.text.trim()) return true
  return hasReadableText(node.root) || hasReadableText(node.children)
}

function readableWordCount(value: unknown): number {
  if (!value || typeof value !== 'object') return 0
  if (Array.isArray(value)) return value.reduce((count, node) => count + readableWordCount(node), 0)
  const node = value as Record<string, unknown>
  if (typeof node.text === 'string') return node.text.trim().split(/\s+/).filter(Boolean).length
  return readableWordCount(node.root) + readableWordCount(node.children)
}

/** Only reviewed Event identities can stand alone without a current offer. */
const approvedContentOnlyParentSlugs = new Set(legacyRedirectDecisions.contentOnlyParentSlugs)

export function isIndexableContentOnlyParentTrip(
  eventContent: unknown,
  activeVariantCount: number,
  currentDateCount: number,
  eventSlug?: string,
): boolean {
  return !!eventSlug && approvedContentOnlyParentSlugs.has(eventSlug) &&
    activeVariantCount === 0 && currentDateCount === 0 && readableWordCount(eventContent) >= 100
}

/** A parent hub needs its own copy and either reviewed choices or launch approval. */
export function isIndexableParentTrip(
  eventContent: unknown,
  variants: Array<Pick<TripVariant, 'active' | 'indexable'>>,
  eventSlug?: string,
): boolean {
  if (!hasReadableText(eventContent)) return false
  const active = variants.filter(variant => variant.active === true)
  const reviewed = active.filter(variant => variant.indexable === true)
  return reviewed.length >= 2 || (active.length > 0 && !!eventSlug && approvedParentTripSlugs.has(eventSlug))
}

/** Reviewed Event-level hub approvals; Variant pages keep their own settings. */
const approvedParentTripSlugs = new Set(legacyRedirectDecisions.approvedVariantHubParentSlugs)

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
