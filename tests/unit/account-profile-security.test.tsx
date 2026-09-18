// tests/unit/account-profile-security.test.tsx
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import checkout from '@/components/checkout/checkout.module.css'
import forms from '@/components/forms/forms.module.css'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: async () => ({
    id: 9,
    name: 'Test Customer',
    phone: '+420 600 000 000',
    email: 'test@example.test',
    pendingEmail: null,
  }),
  requireUser: async () => ({ id: 9 }),
}))
const fixture = vi.hoisted(() => ({ docs: [] as unknown[], update: null as unknown }))
vi.mock('@/lib/payload', () => ({
  getPayloadClient: async () => ({
    find: async () => ({ docs: fixture.docs }),
    update: (...args: unknown[]) => (fixture.update as (...a: unknown[]) => unknown)(...args),
  }),
}))
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}))
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))
vi.mock('@/app/(frontend)/account/profile/actions', () => ({
  updateProfileAction: vi.fn(),
  cancelPendingEmailChangeAction: vi.fn(),
}))
vi.mock('@/app/(frontend)/account/security/actions', () => ({ changePasswordAction: vi.fn() }))

import ProfilePage from '@/app/(frontend)/account/profile/page'
import { ProfileForm } from '@/app/(frontend)/account/profile/ProfileForm'
import SecurityPage from '@/app/(frontend)/account/security/page'
import ConfirmEmailPage from '@/app/(frontend)/account/profile/confirm-email/page'

beforeEach(() => {
  fixture.docs = []
  fixture.update = vi.fn()
})

const initial = { name: 'Test Customer', phone: '+420 600 000 000', email: 'test@example.test' }

it('profile uses the checkout frame, "Your details" and "Save details"', async () => {
  const html = renderToStaticMarkup(await ProfilePage({ searchParams: Promise.resolve({}) }))
  expect(html).toContain('<h1>Your details</h1>')
  expect(html).toContain('data-eyebrow="section">My account</p>')
  expect(html).toContain(`<section class="${checkout.panel}">`)
  expect(html).toContain('data-type="card-lg">Contact details</h2>')
  expect(html).toContain(`class="btn-primary ${checkout.button}">Save details</button>`)
  expect(html).toContain('value="test@example.test"')
  expect(html).toMatch(/<label for="field-email">Email<\/label><input id="field-email"/)
  expect(html).not.toContain(forms.input)
  expect(html).not.toContain(forms.submit)
  expect(html).not.toContain('style=')
})

it('profile confirms a completed email change', async () => {
  const html = renderToStaticMarkup(
    await ProfilePage({ searchParams: Promise.resolve({ 'email-changed': '1' }) }),
  )
  expect(html).toContain('Your sign-in email has been updated.')
})

it('a pending email change is a notice with an outline cancel button, not a text link', () => {
  const html = renderToStaticMarkup(<ProfileForm initial={initial} pendingEmail="new@example.test" />)
  // Announced: after an email change this is the message that matters, not "Details saved."
  expect(html).toContain(`<div class="${checkout.notice}" role="status">`)
  expect(html).toContain('new@example.test')
  expect(html).toContain(`class="btn-ghost ${checkout.button}">Cancel pending email change</button>`)
  expect(html).not.toContain('text-decoration')
})

it('security puts the password form in a panel with the primary button', async () => {
  const html = renderToStaticMarkup(SecurityPage())
  expect(html).toContain('<h1>Security</h1>')
  expect(html).toContain('data-type="card-lg">Change password</h2>')
  // React's server renderer keeps the camelCase attribute name; HTML attribute names are case-insensitive.
  expect(html.toLowerCase()).toContain('autoComplete="new-password"'.toLowerCase())
  expect(html).toContain(`class="btn-primary ${checkout.button}">Change password</button>`)
  expect(html).toContain(`class="${checkout.helper}">At least 8 characters.</span>`)
  expect(html).not.toContain(forms.input)
})

it('confirm-email problems render in the frame with a way back', async () => {
  const html = renderToStaticMarkup(await ConfirmEmailPage({ searchParams: Promise.resolve({}) }))
  expect(html).toContain('<h1>Confirm email</h1>')
  expect(html).toContain(`<div class="${checkout.notice}">`)
  expect(html).toContain('Missing token in URL.')
  expect(html).toMatch(/class="btn-ghost[^"]*" href="\/account\/profile"/)
})

const future = new Date(Date.now() + 60_000).toISOString()

it('confirm-email explains each refusal and changes nothing', async () => {
  const problem = async (docs: unknown[]) => {
    fixture.docs = docs
    return renderToStaticMarkup(
      await ConfirmEmailPage({ searchParams: Promise.resolve({ token: 't' }) }),
    )
  }
  expect(await problem([])).toContain('This link is invalid.')
  expect(
    await problem([{ id: 10, pendingEmail: 'n@example.test', pendingEmailExpiresAt: future }]),
  ).toContain('This link does not belong to your account.')
  expect(
    await problem([
      { id: 9, pendingEmail: 'n@example.test', pendingEmailExpiresAt: '2000-01-01T00:00:00.000Z' },
    ]),
  ).toContain('This link has expired.')
  expect(fixture.update).not.toHaveBeenCalled()
})

it('confirm-email applies a valid link and lands on the page that confirms it', async () => {
  fixture.docs = [{ id: 9, pendingEmail: 'n@example.test', pendingEmailExpiresAt: future }]
  await expect(
    ConfirmEmailPage({ searchParams: Promise.resolve({ token: 't' }) }),
  ).rejects.toThrow('REDIRECT:/account/profile?email-changed=1')
  expect(fixture.update).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'users',
      id: 9,
      data: expect.objectContaining({ email: 'n@example.test', pendingEmail: null }),
    }),
  )
})
