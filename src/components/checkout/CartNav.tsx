'use client'
import Link from 'next/link'
import { useCart } from './useCart'

export function CartNav({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { items, ready } = useCart()
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <Link className={className} href="/cart" onClick={onClick}>
      Cart{ready && count ? ` (${count})` : ''}
    </Link>
  )
}
