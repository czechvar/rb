import React from 'react'

export const metadata = { title: 'Orders — Rockbusters' }

export default function OrdersPage() {
  return (
    <>
      <h1>Your orders</h1>
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          border: '1px dashed #d0cfcd',
          borderRadius: 8,
          color: '#666',
        }}
      >
        <p style={{ fontSize: 18 }}>You haven&apos;t booked any trips yet.</p>
        <p>
          <a href="/programs">Browse trips →</a>
        </p>
      </div>
    </>
  )
}
