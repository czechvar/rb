'use client'
import { useEffect, useState } from 'react'
import type { CartItem } from '@/lib/checkout/types'
import { CART_CHANGED_EVENT, CART_STORAGE_KEY, readCart, writeCart } from './cart-storage'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    const sync = () => {
      setItems(readCart())
      setReady(true)
    }
    const storage = (event: StorageEvent) => {
      if (!event.key || event.key === CART_STORAGE_KEY) sync()
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
  return { items, ready, replace, storageError }
}
