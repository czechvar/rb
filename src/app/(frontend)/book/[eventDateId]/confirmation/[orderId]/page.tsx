import React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { payByCardAction } from './actions'

interface Props {
  params: Promise<{ eventDateId: string; orderId: string }>
}

export const metadata = { title: 'Booking received — Rockbusters' }

export default async function BookingConfirmation({ params }: Props) {
  const { orderId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayloadClient()
  let order
  try {
    order = await payload.findByID({
      collection: 'orders', id: orderId, depth: 1, user, overrideAccess: false,
    })
  } catch {
    notFound()
  }
  const o = order as {
    id: number; orderNumber: string; state: string; user: number | { id: number }
    totalPrice: number; currency: string; participantCount: number
    eventDate: { dateFrom: string; dateTo: string; event?: { title?: string } | number }
    discountAmount?: number
    discountCode?: number | { code: string } | null
    referral?: number | { name: string } | null
  }
  const ownerId = typeof o.user === 'object' ? o.user.id : o.user
  if (ownerId !== user.id) notFound()

  const eventTitle = typeof o.eventDate.event === 'object' ? o.eventDate.event?.title ?? 'Trip' : 'Trip'
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
      <h1>Booking received</h1>
      <p>We&apos;ve sent a confirmation email to <strong>{user.email}</strong>. Our team will confirm your booking shortly.</p>
      <div style={{ background: '#f5f1ea', padding: 24, borderRadius: 8, margin: '24px 0', textAlign: 'left' }}>
        <p><strong>Order:</strong> {o.orderNumber}</p>
        <p><strong>Trip:</strong> {eventTitle}</p>
        <p><strong>Dates:</strong> {new Date(o.eventDate.dateFrom).toLocaleDateString('en-GB')} – {new Date(o.eventDate.dateTo).toLocaleDateString('en-GB')}</p>
        <p><strong>Participants:</strong> {o.participantCount}</p>
        {(o.discountAmount ?? 0) > 0 && (
          <>
            <p><strong>Subtotal:</strong> {o.totalPrice + (o.discountAmount ?? 0)} {o.currency}</p>
            <p style={{ color: '#206020' }}>
              <strong>Discount:</strong> −{o.discountAmount} {o.currency}
              {typeof o.discountCode === 'object' && o.discountCode
                ? ` (${o.discountCode.code})`
                : typeof o.referral === 'object' && o.referral
                  ? ` (${o.referral.name})`
                  : ''}
            </p>
          </>
        )}
        <p><strong>Total:</strong> {o.totalPrice} {o.currency}</p>
      </div>
      {o.state === 'pending' && (
        <form action={payByCardAction.bind(null, o.id)} style={{ margin: '24px 0' }}>
          <button type="submit">Pay by card</button>
        </form>
      )}
      <p>
        <a href={`/account/orders/${o.id}`}>View in your account →</a>
        {' · '}
        <Link href="/programs">Browse more trips</Link>
      </p>
    </div>
  )
}
