import type { Where } from 'payload'
import type { EventDate } from '@/payload-types'

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
