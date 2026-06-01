import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export const metadata = { title: 'Orders — Rockbusters' }

const STATE_LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', paid: 'Paid', completed: 'Completed', cancelled: 'Cancelled',
}
const STATE_COLOR: Record<string, string> = {
  pending: '#a17a00', confirmed: '#1a6a3c', paid: '#1a6a3c', completed: '#444', cancelled: '#999',
}

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'orders',
    where: { user: { equals: user.id } },
    sort: '-createdAt', limit: 100, depth: 1, user, overrideAccess: false,
  })
  if (res.docs.length === 0) {
    return (
      <>
        <h1>Your orders</h1>
        <div style={{ padding: 48, textAlign: 'center', border: '1px dashed #d0cfcd', borderRadius: 8, color: '#666' }}>
          <p style={{ fontSize: 18 }}>You haven&apos;t booked any trips yet.</p>
          <p><a href="/programs">Browse trips →</a></p>
        </div>
      </>
    )
  }
  return (
    <>
      <h1>Your orders</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {res.docs.map((doc) => {
          const o = doc as {
            id: number; orderNumber: string; state: string; totalPrice: number; currency: string
            eventDate?: { dateFrom: string; dateTo: string; event?: { title?: string } | number }
          }
          const title =
            o.eventDate && typeof o.eventDate.event === 'object'
              ? o.eventDate.event?.title ?? 'Trip' : 'Trip'
          const dates = o.eventDate
            ? `${new Date(o.eventDate.dateFrom).toLocaleDateString('en-GB')} – ${new Date(o.eventDate.dateTo).toLocaleDateString('en-GB')}`
            : ''
          return (
            <li key={o.id} style={{ border: '1px solid #e3e0dc', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{dates}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{o.orderNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                    background: STATE_COLOR[o.state] ?? '#666', color: '#fff', fontSize: 12,
                  }}>
                    {STATE_LABEL[o.state] ?? o.state}
                  </span>
                  <div style={{ marginTop: 4 }}>{o.totalPrice} {o.currency}</div>
                  <a href={`/account/orders/${o.id}`}>View →</a>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
