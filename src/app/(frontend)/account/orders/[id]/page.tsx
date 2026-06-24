import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { cancelMyOrderAction } from './actions'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Order — Rockbusters' }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  let order
  try {
    order = await payload.findByID({ collection: 'orders', id, depth: 1, user, overrideAccess: false })
  } catch {
    notFound()
  }
  const o = order as {
    id: number; orderNumber: string; state: string; user: number | { id: number }
    participants: Array<{ firstName: string; lastName: string; email: string; phone: string }>
    billingAddress: Record<string, unknown>
    unitPrice: number; totalPrice: number; currency: string; vat: number; participantCount: number
    customerNote?: string
    eventDate: { dateFrom: string; dateTo: string; event?: { title?: string } | number }
    discountAmount?: number
    discountCommission?: number
    referralCommission?: number
    discountCode?: number | { code: string; title: string } | null
    referral?: number | { name: string } | null
  }
  const ownerId = typeof o.user === 'object' ? o.user.id : o.user
  if (ownerId !== user.id) notFound()

  const eventTitle = typeof o.eventDate.event === 'object' ? o.eventDate.event?.title ?? 'Trip' : 'Trip'
  const cancel = cancelMyOrderAction.bind(null, o.id)

  return (
    <>
      <h1>Order {o.orderNumber}</h1>
      <p><strong>Status:</strong> {o.state}</p>
      <h2>{eventTitle}</h2>
      <p>{new Date(o.eventDate.dateFrom).toLocaleDateString('en-GB')} – {new Date(o.eventDate.dateTo).toLocaleDateString('en-GB')}</p>

      <h3>Participants ({o.participantCount})</h3>
      <ul>
        {o.participants.map((p, i) => (
          <li key={i}>{p.firstName} {p.lastName} — {p.email} · {p.phone}</li>
        ))}
      </ul>

      <h3>Billing address</h3>
      <address style={{ whiteSpace: 'pre-line' }}>
        {[
          (o.billingAddress.company as Record<string, unknown> | undefined)?.companyName,
          `${o.billingAddress.firstName} ${o.billingAddress.lastName}`,
          o.billingAddress.street,
          `${o.billingAddress.postalCode} ${o.billingAddress.city}`,
          o.billingAddress.country,
        ].filter(Boolean).join('\n')}
      </address>

      <h3>Price</h3>
      {(o.discountAmount ?? 0) > 0 ? (
        <>
          <p>
            Subtotal: {o.unitPrice} {o.currency} × {o.participantCount} = {o.totalPrice + (o.discountAmount ?? 0)} {o.currency}
          </p>
          <p style={{ color: '#206020' }}>
            Discount: −{o.discountAmount} {o.currency}
            {typeof o.discountCode === 'object' && o.discountCode
              ? ` (${o.discountCode.code})`
              : typeof o.referral === 'object' && o.referral
                ? ` (${o.referral.name})`
                : ''}
          </p>
          <p><strong>Total: {o.totalPrice} {o.currency}</strong></p>
        </>
      ) : (
        <p>
          {o.unitPrice} {o.currency} × {o.participantCount} = <strong>{o.totalPrice} {o.currency}</strong>
        </p>
      )}
      <p><span style={{ color: '#666', fontSize: 13 }}>VAT {o.vat}% included.</span></p>

      {o.customerNote && (
        <>
          <h3>Your note</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{o.customerNote}</p>
        </>
      )}

      {o.state === 'pending' && (
        <form action={cancel} style={{ marginTop: 24 }}>
          <button type="submit" style={{ background: '#c8102e', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 4, cursor: 'pointer' }}>
            Cancel booking
          </button>
        </form>
      )}
      {o.state === 'confirmed' && (
        <div style={{ background: '#f5f1ea', padding: 16, borderRadius: 6, marginTop: 24 }}>
          <strong>Payment instructions</strong>
          <p style={{ whiteSpace: 'pre-line', marginTop: 8 }}>
            {process.env.BANK_TRANSFER_DETAILS ?? 'Bank transfer details will be shown here once configured.'}
          </p>
          <p>Variable symbol: <strong>{o.orderNumber}</strong></p>
        </div>
      )}
    </>
  )
}
