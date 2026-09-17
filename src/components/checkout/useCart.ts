'use client'
import { useEffect, useState } from 'react'
import type { CartItem } from '@/lib/checkout/types'
import {
  CART_CHANGED_EVENT,
  CART_DISCOUNT_STORAGE_KEY,
  CART_STORAGE_KEY,
  readCart,
  readCartDiscount,
  writeCart,
  writeCartDiscount,
} from './cart-storage'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    const sync = () => {
      setItems(readCart())
      setDiscountCode(readCartDiscount())
      setReady(true)
    }
    const storage = (event: StorageEvent) => {
      if (!event.key || event.key === CART_STORAGE_KEY || event.key === CART_DISCOUNT_STORAGE_KEY)
        sync()
    }
    sync()
    window.addEventListener(CART_CHANGED_EVENT, sync)
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, sync)
      window.removeEventListener('storage', storage)
    }
  }, [])
  function replace(next: CartItem[]) {
    const saved = writeCart(next)
    setStorageError(!saved)
    if (saved) setItems(next)
  }
  function applyDiscount(code: string) {
    const saved = writeCartDiscount(code)
    setStorageError(!saved)
    // An unsaved code still prices this page; it just will not follow the customer to checkout.
    setDiscountCode(code.trim())
  }
  return { items, discountCode, ready, replace, applyDiscount, storageError }
}
