import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { getRemainingCapacity } from '@/lib/capacity'
import { BookingForm } from './BookingForm'

interface Props {
  params: Promise<{ eventDateId: string }>
}

export const metadata = { title: 'Book — Rockbusters' }

function addressLabel(a: Record<string, unknown>): string {
  return (
    (a.label as string) ||
    `${a.firstName as string} ${a.lastName as string} — ${a.city as string}`
  )
}

function addressPreview(a: Record<string, unknown>): string {
  const lines = [
    `${a.firstName} ${a.lastName}`,
    a.street as string,
    `${a.postalCode} ${a.city}`,
    a.country as string,
  ]
  const c = (a.company as Record<string, unknown> | undefined) ?? {}
  if (c.companyName) lines.unshift(c.companyName as string)
  return lines.join('\n')
}

export default async function BookPage({ params }: Props) {
  const { eventDateId: rawId } = await params
  const eventDateId = Number(rawId)

  const user = await getCurrentUser()
  if (!user) redirect(`/login?from=${encodeURIComponent(`/book/${rawId}`)}`)

  const payload = await getPayloadClient()
  let eventDate
  try {
    eventDate = await payload.findByID({ collection: 'event-dates', id: eventDateId, depth: 1 })
  } catch {
    return <div style={{ padding: 32 }}><h1>Date not found</h1></div>
  }
  const ed = eventDate as {
    active?: boolean; price: number; vat: number; currency: string
    dateFrom: string; dateTo: string
    event?: { title?: string; slug?: string } | number
  }
  if (!ed.active) {
    return (
      <div style={{ padding: 32 }}>
        <h1>This date is not available</h1>
        <p><Link href="/programs">Back to trips →</Link></p>
      </div>
    )
  }
  const remaining = await getRemainingCapacity(eventDateId)
  if (remaining <= 0) {
    return (
      <div style={{ padding: 32 }}>
        <h1>Sold out</h1>
        <p>This date is fully booked.</p>
        <p><Link href="/programs">Browse other trips →</Link></p>
      </div>
    )
  }

  const eventTitle = typeof ed.event === 'object' ? ed.event?.title ?? 'Trip' : 'Trip'
  const addresses = ((user.addresses ?? []) as Array<Record<string, unknown>>).map((a, i) => ({
    index: i, label: addressLabel(a), preview: addressPreview(a),
    isDefault: Boolean(a.isDefault),
  }))
  const booker = {
    firstName: user.name?.split(' ')[0] ?? '',
    lastName: user.name?.split(' ').slice(1).join(' ') ?? '',
    email: user.email, phone: user.phone ?? '',
  }
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      <h1>{eventTitle}</h1>
      <p>{new Date(ed.dateFrom).toLocaleDateString('en-GB')} – {new Date(ed.dateTo).toLocaleDateString('en-GB')}</p>
      <p><strong>{ed.price} {ed.currency}</strong> per participant — {remaining} seat(s) remaining</p>
      <BookingForm
        eventDateId={eventDateId} unitPrice={ed.price} currency={ed.currency} vat={ed.vat}
        remaining={remaining} addresses={addresses} booker={booker}
      />
    </div>
  )
}
