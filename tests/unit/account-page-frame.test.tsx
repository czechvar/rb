// tests/unit/account-page-frame.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountPage } from '@/app/(frontend)/account/AccountPage'
import { ReservationHeader } from '@/components/checkout/ReservationHeader'

it('AccountPage renders a one-line eyebrow, the H1, lead, actions and children in the checkout frame', () => {
  const html = renderToStaticMarkup(
    <AccountPage title="Addresses" lead="Reusable billing addresses." actions={<button type="button">Add</button>}>
      <p>Body</p>
    </AccountPage>,
  )
  expect(html.startsWith(`<div class="${checkout.account}"><header class="${checkout.header}">`)).toBe(true)
  expect(html).toContain(`<p class="${checkout.eyebrow}" data-eyebrow="section">My account</p>`)
  expect(html).toContain('<h1 data-type="section">Addresses</h1>')
  expect(html).toContain(`<p class="${checkout.lead}">Reusable billing addresses.</p>`)
  expect(html).toContain(`<div class="${checkout.actions}"><button type="button">Add</button></div>`)
  expect(html.indexOf('</header>')).toBeLessThan(html.indexOf('<p>Body</p>'))
})

it('AccountPage omits the lead and actions when they are not given and accepts an eyebrow', () => {
  const html = renderToStaticMarkup(
    <AccountPage title="Security" eyebrow="Your order">
      <p>Body</p>
    </AccountPage>,
  )
  expect(html).toContain('>Your order</p>')
  expect(html).not.toContain(checkout.lead)
  expect(html).not.toContain(checkout.actions)
})

it('ReservationHeader keeps its reservation wording by default', () => {
  const html = renderToStaticMarkup(
    <ReservationHeader reference="RB-C-1" title="Upcoming trips" status="Reserved" />,
  )
  expect(html).toContain('>Your reservation</p>')
  expect(html).toContain('Reservation reference')
})

it('ReservationHeader can present an order', () => {
  const html = renderToStaticMarkup(
    <ReservationHeader
      reference="RB-2026-000123"
      title="Gorges du Tarn"
      status="Confirmed"
      eyebrow="Your order"
      referenceLabel="Order number"
    />,
  )
  expect(html).toContain('>Your order</p>')
  expect(html).toContain('Order number')
  expect(html).not.toContain('Reservation reference')
  expect(html).toContain('<code>RB-2026-000123</code>')
})
