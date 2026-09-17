// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CheckoutInvitationForm, VerifyCheckoutForm } from '@/app/(frontend)/checkout/IdentityForms'

const { verify, accept, kind, loginInvitation, replace } = vi.hoisted(() => ({
  verify: vi.fn(),
  accept: vi.fn(),
  kind: vi.fn(),
  loginInvitation: vi.fn(),
  replace: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))
vi.mock('@/app/(frontend)/checkout/identity-actions', () => ({
  verifyGuestCheckoutAction: verify,
  acceptCheckoutInvitationAction: accept,
  reviewGuestCheckoutAction: vi.fn(),
  checkoutInvitationKindAction: kind,
  loginCheckoutInvitationAction: loginInvitation,
}))
beforeEach(() => {
  sessionStorage.clear()
  verify.mockReset()
  accept.mockReset()
  kind.mockReset()
  loginInvitation.mockReset()
  replace.mockReset()
  verify.mockResolvedValue({ ok: true })
  kind.mockResolvedValue({ kind: 'login' })
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => setTimeout(callback, 0))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('redeems a legacy verification-link fragment only after deliberate submission', async () => {
  window.history.replaceState(null, '', `/checkout/verify?checkout=7#token=${'a'.repeat(43)}`)
  render(<VerifyCheckoutForm id={7} />)
  expect(window.location.hash).toBe('')
  expect(screen.getByRole('button').classList.contains('btn-primary')).toBe(true)
  await waitFor(() =>
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false),
  )
  expect(verify).not.toHaveBeenCalled()
  expect(
    (screen.getByRole('button').closest('form')!.elements.namedItem('token') as HTMLInputElement)
      .value,
  ).toBe('a'.repeat(43))
  fireEvent.submit(screen.getByRole('button').closest('form')!)
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain('reserved for staff review'),
  )
  expect(verify).toHaveBeenCalledTimes(1)
  expect(sessionStorage.getItem('rb-checkout-verify-7')).toBeNull()
})

it('shows an existing user an inline sign-in that continues to the checkout payment', async () => {
  loginInvitation.mockResolvedValue({ ok: true, redirect: '/account/checkouts/8#payment' })
  window.history.replaceState(null, '', `/checkout/invite?checkout=8#token=${'b'.repeat(43)}`)
  render(<CheckoutInvitationForm id={8} />)

  fireEvent.change(await screen.findByLabelText('Password'), {
    target: { value: 'FixturePassword42!' },
  })
  const button = screen.getByRole('button', { name: 'Sign in and continue to payment' })
  expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
  expect(window.location.hash).toBe('')
  expect(accept).not.toHaveBeenCalled()
  fireEvent.submit(button.closest('form')!)

  await waitFor(() => expect(replace).toHaveBeenCalledWith('/account/checkouts/8#payment'))
  expect(loginInvitation).toHaveBeenCalledTimes(1)
  const submitted = loginInvitation.mock.calls[0][1] as FormData
  expect(submitted.get('checkout')).toBe('8')
  expect(submitted.get('token')).toBe('b'.repeat(43))
  expect(submitted.get('password')).toBe('FixturePassword42!')
  expect(sessionStorage.getItem('rb-checkout-invite-8')).toBeNull()
})

it('prefills the invited name, creates the account and redirects directly to payment', async () => {
  kind.mockResolvedValue({
    kind: 'create',
    name: 'Ada Lovelace',
    email: 'ada@example.test',
  })
  accept.mockResolvedValue({ ok: true, redirect: '/account/checkouts/8#payment' })
  window.history.replaceState(null, '', `/checkout/invite?checkout=8#token=${'c'.repeat(43)}`)

  render(<CheckoutInvitationForm id={8} />)

  expect(((await screen.findByLabelText('Full name')) as HTMLInputElement).value).toBe(
    'Ada Lovelace',
  )
  expect(
    screen
      .getByRole('button', { name: 'Create account and continue' })
      .classList.contains('btn-primary'),
  ).toBe(true)
  expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('ada@example.test')
  fireEvent.change(screen.getByLabelText('Choose a password'), {
    target: { value: 'FixturePassword42!' },
  })
  fireEvent.change(screen.getByLabelText('Confirm password'), {
    target: { value: 'FixturePassword42!' },
  })
  fireEvent.submit(
    screen.getByRole('button', { name: 'Create account and continue' }).closest('form')!,
  )

  await waitFor(() => expect(replace).toHaveBeenCalledWith('/account/checkouts/8#payment'))
  expect(sessionStorage.getItem('rb-checkout-invite-8')).toBeNull()
})
