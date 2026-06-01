import React from 'react'
import Link from 'next/link'
import { getRemainingCapacity } from '@/lib/capacity'

interface Props {
  eventDateId: number
  active: boolean
}

export async function DateRowBookButton({ eventDateId, active }: Props) {
  if (!active) {
    return <span style={{ color: '#999' }}>Unavailable</span>
  }
  const remaining = await getRemainingCapacity(eventDateId)
  if (remaining <= 0) {
    return <span style={{ color: '#c8102e', fontWeight: 600 }}>Sold out</span>
  }
  return (
    <Link
      href={`/book/${eventDateId}`}
      style={{
        background: '#c8102e', color: '#fff', textDecoration: 'none',
        padding: '8px 14px', borderRadius: 4, fontWeight: 600, display: 'inline-block',
      }}
    >
      Book this date
    </Link>
  )
}
