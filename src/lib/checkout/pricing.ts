import type { CartItem } from './types'

export function normalizeCart(items: CartItem[]): CartItem[] {
  if (!Array.isArray(items) || !items.length || items.length > 50)
    throw new Error('Choose between one and 50 dated trips.')
  const quantities = new Map<number, number>()
  for (const item of items) {
    if (
      !Number.isSafeInteger(item.eventDateId) ||
      item.eventDateId < 1 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100
    )
      throw new Error('Invalid trip or seat quantity.')
    const total = (quantities.get(item.eventDateId) ?? 0) + item.quantity
    if (total > 100) throw new Error('Contact us for groups larger than 100.')
    quantities.set(item.eventDateId, total)
  }
  return [...quantities]
    .sort(([a], [b]) => a - b)
    .map(([eventDateId, quantity]) => ({ eventDateId, quantity }))
}
export function minorUnits(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error('Invalid trip price.')
  const result = Math.round(value * 100)
  if (!Number.isSafeInteger(result)) throw new Error('Trip price is too large.')
  return result
}
export function balanceDeadline(dateFrom: string): string {
  const date = new Date(dateFrom)
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid departure date.')
  date.setUTCDate(date.getUTCDate() - 30)
  return date.toISOString()
}
export function initialAmount(totalMinor: number, dueAt: string, now = new Date()): number {
  return new Date(dueAt) <= now ? totalMinor : Math.round(totalMinor / 4)
}
export function discountedMinor(base: number, percent: number): number {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100)
    throw new Error('Invalid discount.')
  return Math.round((base * percent) / 100)
}
