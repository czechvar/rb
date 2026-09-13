// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CheckoutInvitationForm, VerifyCheckoutForm } from '@/app/(frontend)/checkout/IdentityForms'

const { verify, accept, kind } = vi.hoisted(() => ({
  verify: vi.fn(),
  accept: vi.fn(),
  kind: vi.fn(),
}))
vi.mock('@/app/(frontend)/checkout/identity-actions', () => ({
  verifyGuestCheckoutAction: verify,
  acceptCheckoutInvitationAction: accept,
  reviewGuestCheckoutAction: vi.fn(),
  checkoutInvitationKindAction: kind,
}))
beforeEach(() => {
  sessionStorage.clear()
  verify.mockReset()
  accept.mockReset()
  kind.mockReset()
  verify.mockResolvedValue({ ok: true })
  kind.mockResolvedValue('login')
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => setTimeout(callback, 0))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('removes the fragment immediately and reserves only after deliberate submission', async () => {
  window.history.replaceState(null, '', `/checkout/verify?checkout=7#token=${'a'.repeat(43)}`)
  render(<VerifyCheckoutForm id={7} />)
  expect(window.location.hash).toBe('')
  await waitFor(() =>
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false),
  )
  expect(verify).not.toHaveBeenCalled()
  fireEvent.submit(screen.getByRole('button').closest('form')!)
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain('reserved for staff review'),
  )
  expect(verify).toHaveBeenCalledTimes(1)
  expect(sessionStorage.getItem('rb-checkout-verify-7')).toBeNull()
})

it('keeps invitation tokens out of the login return URL and survives same-tab login', async () => {
  window.history.replaceState(null, '', `/checkout/invite?checkout=8#token=${'b'.repeat(43)}`)
  const first = render(<CheckoutInvitationForm id={8} />)
  const login = await screen.findByRole('link', { name: 'Sign in' })
  expect(login.getAttribute('href')).toBe('/login?from=%2Fcheckout%2Finvite%3Fcheckout%3D8')
  expect(window.location.hash).toBe('')
  expect(accept).not.toHaveBeenCalled()
  first.unmount()
  kind.mockResolvedValue('continue')
  render(<CheckoutInvitationForm id={8} />)
  expect(await screen.findByRole('button', { name: 'Connect my account' })).toBeTruthy()
  expect(accept).not.toHaveBeenCalled()
})
