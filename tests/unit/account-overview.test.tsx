// tests/unit/account-overview.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'

const fixture = vi.hoisted(() => ({
  reservationsOn: true,
  counts: { orders: 3, checkouts: 1 } as Record<string, number>,
  countArgs: [] as Record<string, unknown>[],
  addresses: [{ id: 'a1' }, { id: 'a2' }] as unknown[],
  name: 'Test Customer',
}))
vi.mock('@/lib/checkout/feature', () => ({ checkoutEnabled: () => fixture.reservationsOn }))
vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({
    id: 9,
    name: fixture.name,
    email: 'test@example.test',
    phone: '+420 600 000 000',
    addresses: fixture.addresses,
  }),
}))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))
vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    count: async (args: Record<string, unknown>) => {
      fixture.countArgs.push(args)
      return { totalDocs: fixture.counts[args.collection as string] }
    },
  }),
}))

import AccountOverviewPage from '@/app/(frontend)/account/page'

const render = async (sp: Record<string, string> = {}) =>
  renderToStaticMarkup(await AccountOverviewPage({ searchParams: Promise.resolve(sp) }))

beforeEach(() => {
  fixture.reservationsOn = true
  fixture.counts = { orders: 3, checkouts: 1 }
  fixture.countArgs = []
  fixture.addresses = [{ id: 'a1' }, { id: 'a2' }]
  fixture.name = 'Test Customer'
})

it('greets by first name and links every section from a panel with real counts', async () => {
  const html = await render()
  expect(html).toContain('<h1>Welcome back, Test</h1>')
  expect(html.split(`class="${checkout.panel} `).length - 1).toBe(4)
  expect(html).toContain('1 reservation')
  expect(html).not.toContain('1 reservations')
  expect(html).toContain('3 orders')
  expect(html).toContain('2 addresses on file')
  expect(html).toContain('test@example.test')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/checkouts">View reservations<\/a>/)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/orders">View orders<\/a>/)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/profile">Edit details<\/a>/)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses">Manage addresses<\/a>/)
  expect(html).not.toContain('style=')
})

it('counts only the signed-in customer\'s records, through access control', async () => {
  await render()
  expect(fixture.countArgs).toHaveLength(2)
  for (const args of fixture.countArgs) {
    expect(args).toMatchObject({ where: { user: { equals: 9 } }, overrideAccess: false })
    expect(args.user).toMatchObject({ id: 9 })
  }
})

it('hides reservations and skips their count when grouped checkout is off', async () => {
  fixture.reservationsOn = false
  const html = await render()
  expect(html).not.toContain('/account/checkouts')
  expect(fixture.countArgs.map((args) => args.collection)).toEqual(['orders'])
})

it('words empty sections plainly', async () => {
  fixture.counts = { orders: 0, checkouts: 0 }
  fixture.addresses = []
  const html = await render()
  expect(html).toContain('No orders yet.')
  expect(html).toContain('No reservations yet.')
  expect(html).toContain('No addresses on file.')
})

it('keeps the password-reset confirmation', async () => {
  expect(await render({ 'password-reset': '1' })).toContain('Password changed.')
  // confirm-email redirects to the profile page, which owns that confirmation.
  expect(await render({ 'email-changed': '1' })).not.toContain('sign-in email')
})

it('uses the singular for one of each', async () => {
  fixture.counts = { orders: 1, checkouts: 1 }
  fixture.addresses = [{ id: 'a1' }]
  const html = await render()
  expect(html).toContain('>1 order</p>')
  expect(html).toContain('>1 reservation</p>')
  expect(html).toContain('>1 address on file</p>')
})

it('greets a one-word or padded name without a dangling comma', async () => {
  fixture.name = 'Madonna'
  expect(await render()).toContain('<h1>Welcome back, Madonna</h1>')
  fixture.name = '  Jan Novak'
  expect(await render()).toContain('<h1>Welcome back, Jan</h1>')
  fixture.name = '   '
  expect(await render()).toContain('<h1>Welcome back</h1>')
})
