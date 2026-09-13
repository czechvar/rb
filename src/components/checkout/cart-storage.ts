import type { CartItem } from '@/lib/checkout/types'

export const CART_STORAGE_KEY = 'rockbusters-cart-v1'
export const CART_CHANGED_EVENT = 'rockbusters-cart-changed'
export const MAX_CART_ITEMS = 50
export const MAX_CART_QUANTITY = 100

/** Project untrusted storage onto selection-only fields; never retain prices or personal data. */
export function parseCart(value: string | null): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]')
    if (!Array.isArray(parsed)) return []
    const items = new Map<number, number>()
    for (const raw of parsed) {
      if (!raw || typeof raw !== 'object') continue
      const { eventDateId, quantity } = raw
      if (
        !Number.isSafeInteger(eventDateId) ||
        eventDateId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_CART_QUANTITY
      )
        continue
      if (!items.has(eventDateId) && items.size >= MAX_CART_ITEMS) continue
      items.set(eventDateId, quantity)
    }
    return [...items].map(([eventDateId, quantity]) => ({ eventDateId, quantity }))
  } catch {
    return []
  }
}

export function readCart(): CartItem[] {
  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return []
  }
}
export function writeCart(items: CartItem[]): boolean {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parseCart(JSON.stringify(items))))
    window.dispatchEvent(new Event(CART_CHANGED_EVENT))
    return true
  } catch {
    return false
  }
}
export function addCartItem(items: CartItem[], eventDateId: number): CartItem[] {
  if (items.some((item) => item.eventDateId === eventDateId)) return items
  return parseCart(JSON.stringify([...items, { eventDateId, quantity: 1 }]))
}
