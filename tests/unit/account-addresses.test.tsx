// tests/unit/account-addresses.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'
import forms from '@/components/forms/forms.module.css'

const fixture = vi.hoisted(() => ({ addresses: [] as unknown[] }))
vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({ id: 9, name: 'Test Customer', addresses: fixture.addresses }),
}))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), redirect: vi.fn() }))
vi.mock('@/app/(frontend)/account/addresses/actions', () => ({
  addAddressAction: vi.fn(),
  updateAddressAction: vi.fn(),
  deleteAddressAction: vi.fn(),
  setDefaultAddressAction: vi.fn(),
}))

import AddressesPage from '@/app/(frontend)/account/addresses/page'
import AddAddressPage from '@/app/(frontend)/account/addresses/new/page'
import EditAddressPage from '@/app/(frontend)/account/addresses/[idx]/edit/page'

const home = {
  id: 'a1',
  label: 'Home',
  isDefault: true,
  firstName: 'Test',
  lastName: 'Customer',
  street: 'Main 1',
  city: 'Prague',
  postalCode: '11000',
  country: 'CZ',
}
const office = {
  id: 'a2',
  label: '',
  isDefault: false,
  firstName: 'Test',
  lastName: 'Customer',
  street: 'Work 2',
  city: 'Brno',
  postalCode: '60200',
  country: 'CZ',
  company: { companyName: 'Climb s.r.o.', ico: '12345678', dic: 'CZ12345678' },
}

beforeEach(() => {
  fixture.addresses = [home, office]
})

it('lists addresses as panels with a default badge and outline action buttons', async () => {
  const html = renderToStaticMarkup(await AddressesPage())
  expect(html).toContain('<h1>Addresses</h1>')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses\/new">Add address<\/a>/)
  expect(html.split(`<section class="${checkout.panel}">`)).toHaveLength(3)
  expect(html).toContain('data-type="card-lg">Home</h2>')
  // An empty label falls back to a numbered name instead of an empty heading.
  expect(html).toContain('data-type="card-lg">Address 2</h2>')
  expect(html.match(new RegExp(`class="${checkout.statusBadge}">Default`, 'g'))).toHaveLength(1)
  expect(html).toContain('Climb s.r.o. · IČO 12345678 · DIČ CZ12345678')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses\/1\/edit">Edit<\/a>/)
  expect(html.match(/>Set as default<\/button>/g)).toHaveLength(1)
  expect(html.match(/>Delete<\/button>/g)).toHaveLength(2)
  expect(html).not.toContain('style=')
})

it('invites the first address from a notice when none exist', async () => {
  fixture.addresses = []
  const html = renderToStaticMarkup(await AddressesPage())
  expect(html).toContain(`<div class="${checkout.notice}">`)
  expect(html).toMatch(/class="btn-primary[^"]*" href="\/account\/addresses\/new">Add your first address<\/a>/)
  // The header action would duplicate the notice button.
  expect(html.match(/href="\/account\/addresses\/new"/g)).toHaveLength(1)
})

it('the add form sits in a "Your details" panel with paired rows and checkout controls', () => {
  const html = renderToStaticMarkup(AddAddressPage())
  expect(html).toContain('<h1>Add address</h1>')
  expect(html).toContain('data-type="card-lg">Your details</h2>')
  expect(html.split(`class="${checkout.formRow}"`).length - 1).toBe(2)
  expect(html).toContain(`class="btn-primary ${checkout.button}">Add address</button>`)
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/addresses">All addresses<\/a>/)
  expect(html).not.toContain(forms.input)
  expect(html).not.toContain('style=')
})

it('the edit form prefills, shows company fields and saves with "Save details"', async () => {
  const html = renderToStaticMarkup(await EditAddressPage({ params: Promise.resolve({ idx: '1' }) }))
  expect(html).toContain('<h1>Edit address</h1>')
  expect(html).toContain('value="Work 2"')
  expect(html).toContain('value="Climb s.r.o."')
  expect(html.split(`class="${checkout.formRow}"`).length - 1).toBe(3)
  expect(html).toContain(`class="btn-primary ${checkout.button}">Save details</button>`)
})
