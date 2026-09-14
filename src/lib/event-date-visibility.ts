import type { Where } from 'payload'
import type { EventDate } from '@/payload-types'
import { isPublicOccurrenceSlug } from '@/lib/occurrence-routing'

export type EventDateLifecycle = 'upcoming' | 'in-progress' | 'ended' | 'invalid'

type LifecycleDate = Pick<EventDate, 'dateFrom' | 'dateTo'>
type CheckoutDate = Pick<EventDate, 'active' | 'capacity' | 'dateFrom' | 'dateTo' | 'remainingSeats'>
type PublicOccurrence = CheckoutDate & Pick<EventDate, 'slug'>

export function catalogueDateFloor(now = new Date()): string {
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}T00:00:00.000Z`
}

export function upcomingEventDateWhere(now = new Date()): Where {
  return { dateFrom: { greater_than_equal: catalogueDateFloor(now) } }
}

export function isUpcomingEventDate(date: Pick<EventDate, 'dateFrom'>, now = new Date()): boolean {
  return new Date(date.dateFrom).getTime() >= new Date(catalogueDateFloor(now)).getTime()
}

export function eventDateLifecycle(date: LifecycleDate, now = new Date()): EventDateLifecycle {
  const start = Date.parse(date.dateFrom)
  const end = Date.parse(date.dateTo)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'invalid'
  if (start > now.getTime()) return 'upcoming'
  if (end >= now.getTime()) return 'in-progress'
  return 'ended'
}

/** Matches checkout's active/future-start rule, using live derived capacity. */
export function canCheckoutEventDate(date: CheckoutDate, now = new Date()): boolean {
  const seats = date.remainingSeats ?? date.capacity
  return date.active === true && eventDateLifecycle(date, now) === 'upcoming' &&
    date.capacity > 0 && seats > 0
}

/** Parent selection additionally requires a stable public occurrence path. */
export function isBookableEventDate(date: PublicOccurrence, now = new Date()): boolean {
  return isPublicOccurrenceSlug(date.slug) &&
    typeof date.remainingSeats === 'number' && canCheckoutEventDate(date, now)
}

export function selectBookableOccurrence<T extends PublicOccurrence>(dates: T[], now = new Date()): T | null {
  return dates.filter(date => isBookableEventDate(date, now)).sort((left, right) =>
    Date.parse(left.dateFrom) - Date.parse(right.dateFrom) ||
    (left.slug ?? '').localeCompare(right.slug ?? ''))[0] ?? null
}
