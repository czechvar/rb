// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow'
import { CheckoutPayment } from '@/components/checkout/CheckoutPayment'
import { CART_STORAGE_KEY } from '@/components/checkout/cart-storage'

const mocks = vi.hoisted(() => ({
  quote: vi.fn(),
  reserve: vi.fn(),
  guest: vi.fn(),
  verifyGuest: vi.fn(),
  lookup: vi.fn(),
  login: vi.fn(),
  pay: vi.fn(),
  cancel: vi.fn(),
  billing: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, refresh: mocks.refresh }),
}))
vi.mock('@/app/(frontend)/checkout/actions', () => ({
  quoteCartAction: mocks.quote,
  reserveCheckoutAction: mocks.reserve,
  payCheckoutAction: mocks.pay,
  cancelCheckoutAction: mocks.cancel,
  saveCheckoutBillingAction: mocks.billing,
}))
vi.mock('@/app/(frontend)/checkout/identity-actions', () => ({
  createGuestCheckoutAction: mocks.guest,
  loginCheckoutAction: mocks.login,
  lookupCheckoutJourneyAction: mocks.lookup,
  verifyGuestCheckoutAction: mocks.verifyGuest,
}))
const item = {
  eventDateId: 123,
  quantity: 1,
  title: 'Test climbing trip',
  dateFrom: '2030-06-01',
  dateTo: '2030-06-08',
  currency: 'EUR' as const,
  unitMinor: 10000,
  totalMinor: 10000,
  depositMinor: 2500,
  totalCzkMinor: 250000,
  depositCzkMinor: 62500,
  balanceDueAt: '2030-05-02',
  vat: 0,
  paidMinor: 0,
  paidCzkMinor: 0,
  refundedMinor: 0,
  refundedCzkMinor: 0,
  discountMinor: 0,
  discountCommissionMinor: 0,
  referralCommissionMinor: 0,
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.lookup.mockResolvedValue({ ok: true, journey: 'new' })
  window.localStorage.clear()
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([{ eventDateId: 123, quantity: 1 }]))
  mocks.quote.mockResolvedValue({
    ok: true,
    quote: {
      items: [item],
      currency: 'EUR',
      totalMinor: 10000,
      initialMinor: 2500,
      benefitEligible: true,
    },
  })
})
afterEach(cleanup)

it('restores the same dated selections after login and updates quantities without storing personal data', async () => {
  const view = render(<CheckoutFlow mode="cart" />)
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  fireEvent.change(screen.getByLabelText('Participants'), { target: { value: '3' } })
  await waitFor(() =>
    expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toEqual([
      { eventDateId: 123, quantity: 3 },
    ]),
  )
  view.unmount()
  render(
    <CheckoutFlow
      mode="checkout"
      contact={{ name: 'Test Visitor', email: 'visitor@example.test', phone: '+420123456789' }}
    />,
  )
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  expect((screen.getByLabelText('Participants') as HTMLInputElement).value).toBe('3')
  expect(window.localStorage.getItem(CART_STORAGE_KEY)).not.toContain('visitor')
})

it('routes an authenticated customer directly to reservation and payment', async () => {
  mocks.reserve.mockResolvedValue({ ok: false, formError: 'Please retry.' })
  render(
    <CheckoutFlow
      mode="checkout"
      contact={{ name: 'Test Customer', email: 'customer@example.test', phone: '+420123456789' }}
    />,
  )
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  expect(screen.getByRole('heading', { name: 'Welcome back, Test Customer' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Send verification email' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Reserve checkout' })).toBeNull()
  expect(screen.queryByLabelText('Email')).toBeNull()
  expect(screen.queryByLabelText('Full name')).toBeNull()
  expect(screen.queryByLabelText('Phone including country code (optional)')).toBeNull()
  expect(
    screen
      .getByRole('button', { name: 'Reserve and continue to payment' })
      .classList.contains('btn-primary'),
  ).toBe(true)
  fireEvent.submit(
    screen.getByRole('button', { name: 'Reserve and continue to payment' }).closest('form')!,
  )
  await waitFor(() => expect(mocks.reserve).toHaveBeenCalledTimes(1))
  expect(mocks.guest).not.toHaveBeenCalled()
})

it('keeps a new guest on checkout and asks for the emailed six-digit code inline', async () => {
  mocks.guest
    .mockResolvedValueOnce({ ok: false, formError: 'Please retry.' })
    .mockResolvedValueOnce({ ok: true, checkoutId: 42 })
  render(<CheckoutFlow mode="checkout" />)
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'visitor@example.test' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Continue with email' }).closest('form')!)
  await screen.findByLabelText('Full name')
  expect(
    (screen.getByLabelText('Phone including country code (optional)') as HTMLInputElement).required,
  ).toBe(false)
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Visitor' } })
  fireEvent.change(screen.getByLabelText('Phone including country code (optional)'), {
    target: { value: '+420123456789' },
  })
  fireEvent.submit(screen.getByRole('button', { name: 'Send verification email' }).closest('form')!)
  await screen.findByRole('alert')
  expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe('Test Visitor')
  const firstId = mocks.guest.mock.calls[0][1].get('submissionKey')
  fireEvent.submit(screen.getByRole('button', { name: 'Send verification email' }).closest('form')!)
  const code = await screen.findByLabelText('Verification code')
  expect(screen.getByText(/We emailed a six-digit verification code/).tagName).toBe('STRONG')
  expect(code.getAttribute('inputmode')).toBe('numeric')
  expect(code.getAttribute('autocomplete')).toBe('one-time-code')
  expect(code.getAttribute('maxlength')).toBe('6')
  expect((screen.getByRole('button', { name: 'Remove' }) as HTMLButtonElement).disabled).toBe(true)
  expect((screen.getByLabelText('Participants') as HTMLInputElement).disabled).toBe(true)
  expect((screen.getByLabelText('Discount code (optional)') as HTMLInputElement).disabled).toBe(
    true,
  )
  expect(screen.queryByRole('link', { name: 'Add another trip' })).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Verify and reserve' }).classList.contains('btn-primary'),
  ).toBe(true)
  expect(mocks.push).not.toHaveBeenCalled()
  expect(mocks.guest.mock.calls[1][1].get('submissionKey')).toBe(firstId)
  expect(mocks.reserve).not.toHaveBeenCalled()
  expect(mocks.verifyGuest).not.toHaveBeenCalled()
  expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toHaveLength(1)
})

it('keeps the submitted cart intact when guest code verification fails', async () => {
  mocks.guest.mockResolvedValue({ ok: true, checkoutId: 42 })
  mocks.verifyGuest.mockResolvedValue({ ok: false, formError: 'That code is invalid or expired.' })
  render(<CheckoutFlow mode="checkout" />)
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'visitor@example.test' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Continue with email' }).closest('form')!)
  await screen.findByLabelText('Full name')
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Visitor' } })
  fireEvent.change(screen.getByLabelText('Phone including country code (optional)'), {
    target: { value: '+420123456789' },
  })
  fireEvent.submit(screen.getByRole('button', { name: 'Send verification email' }).closest('form')!)
  const code = await screen.findByLabelText('Verification code')
  fireEvent.change(code, { target: { value: '123456' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Verify and reserve' }).closest('form')!)
  await screen.findByText('That code is invalid or expired.')
  expect(mocks.verifyGuest).toHaveBeenCalledTimes(1)
  expect(mocks.verifyGuest.mock.calls[0][1].get('checkout')).toBe('42')
  expect(mocks.verifyGuest.mock.calls[0][1].get('code')).toBe('123456')
  expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toEqual([
    { eventDateId: 123, quantity: 1 },
  ])
  expect(screen.getByLabelText('Verification code')).toBeTruthy()
})

it('clears only the submitted guest quantities after verification and keeps success visible', async () => {
  mocks.guest.mockResolvedValue({ ok: true, checkoutId: 42 })
  mocks.verifyGuest.mockResolvedValue({ ok: true })
  render(<CheckoutFlow mode="checkout" />)
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'visitor@example.test' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Continue with email' }).closest('form')!)
  await screen.findByLabelText('Full name')
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Visitor' } })
  fireEvent.change(screen.getByLabelText('Phone including country code (optional)'), {
    target: { value: '+420123456789' },
  })
  fireEvent.submit(screen.getByRole('button', { name: 'Send verification email' }).closest('form')!)
  const code = await screen.findByLabelText('Verification code')

  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify([
      { eventDateId: 123, quantity: 2 },
      { eventDateId: 456, quantity: 2 },
    ]),
  )
  fireEvent.change(code, { target: { value: '123456' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Verify and reserve' }).closest('form')!)

  expect(
    await screen.findByRole('heading', { name: 'Your trips are reserved for review' }),
  ).toBeTruthy()
  expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toEqual([
    { eventDateId: 123, quantity: 1 },
    { eventDateId: 456, quantity: 2 },
  ])
  expect(mocks.push).not.toHaveBeenCalled()
  expect(screen.queryByText('Your cart is empty')).toBeNull()
})

it('does not submit while a server quote is unavailable', async () => {
  mocks.quote.mockResolvedValue({ ok: false, error: 'Date unavailable.' })
  render(<CheckoutFlow mode="checkout" />)
  await screen.findByText('Date unavailable.')
  expect(
    (screen.getByRole('button', { name: 'Continue with email' }) as HTMLButtonElement).disabled,
  ).toBe(true)
  expect(mocks.guest).not.toHaveBeenCalled()
})

it('keeps the original payment method after settlement and submits selected balances', async () => {
  mocks.pay.mockResolvedValue({ ok: false, formError: 'Provider unavailable.' })
  render(
    <CheckoutPayment
      asOf={Date.parse('2026-01-01')}
      checkoutId={1}
      state="approved"
      currency="EUR"
      items={[{ ...item, paidMinor: 2500 }]}
      paymentMethod="muzapay"
      billingReady
      billingAddress={{
        firstName: 'Saved',
        lastName: 'Customer',
        street: 'Saved street 1',
        city: 'Prague',
        postalCode: '11000',
        country: 'Czechia',
      }}
      methods={{ card: true, benefit: true }}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Edit payer address' }))
  expect((screen.getByLabelText('First name') as HTMLInputElement).value).toBe('Saved')
  expect((screen.getByLabelText('Street and number') as HTMLInputElement).value).toBe(
    'Saved street 1',
  )
  expect(screen.getByRole('button', { name: 'Update payer address' })).toBeTruthy()
  expect(screen.queryByRole('option', { name: 'Card — Comgate' })).toBeNull()
  expect(
    (screen.getByRole('radio', { name: /Pay selected trip balances/ }) as HTMLInputElement).checked,
  ).toBe(true)
  expect(
    screen
      .getByRole('button', { name: 'Continue to secure payment' })
      .classList.contains('btn-primary'),
  ).toBe(true)
  await act(async () => {
    fireEvent.submit(
      screen.getByRole('button', { name: 'Continue to secure payment' }).closest('form')!,
    )
  })
  expect(mocks.pay.mock.calls[0][1].getAll('itemIds')).toEqual(['123'])
  expect(mocks.pay.mock.calls[0][1].get('method')).toBe('muzapay')
  expect(screen.getByRole('alert').textContent).toContain('Provider unavailable.')
})

it('collects billing before an approved new customer can open payment and preserves failed fields', async () => {
  mocks.billing.mockResolvedValue({ ok: false, formError: 'Address unavailable.' })
  render(
    <CheckoutPayment
      asOf={Date.parse('2026-01-01')}
      checkoutId={1}
      state="approved"
      currency="EUR"
      items={[item]}
      methods={{ card: true, benefit: true }}
    />,
  )
  expect(screen.queryByRole('button', { name: 'Continue to secure payment' })).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Save payer address' }).classList.contains('btn-primary'),
  ).toBe(true)
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Test' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Save payer address' }).closest('form')!)
  await screen.findByText('Address unavailable.')
  expect((screen.getByLabelText('First name') as HTMLInputElement).value).toBe('Test')
  expect(mocks.pay).not.toHaveBeenCalled()
})

it('anchors payment and defaults an approved checkout to the amount due now', () => {
  render(
    <CheckoutPayment
      asOf={Date.parse('2026-01-01')}
      checkoutId={1}
      state="approved"
      currency="EUR"
      items={[item]}
      billingReady
      methods={{ card: true, benefit: true }}
    />,
  )
  expect(document.querySelector('#payment')).toBeTruthy()
  expect(
    (screen.getByRole('radio', { name: /Pay the initial amount/ }) as HTMLInputElement).checked,
  ).toBe(true)
  expect(
    (screen.getByRole('radio', { name: /Pay outstanding total/ }) as HTMLInputElement).checked,
  ).toBe(false)
})

it('never calls an unpriced or unconfigured Benefit-only checkout paid in full', () => {
  render(
    <CheckoutPayment
      asOf={Date.parse('2026-01-01')}
      checkoutId={1}
      state="approved"
      currency="EUR"
      items={[{ ...item, totalCzkMinor: null, depositCzkMinor: null }]}
      billingReady
      methods={{ card: false, benefit: true }}
    />,
  )
  expect(screen.queryByText('Your checkout is paid in full.')).toBeNull()
  expect(screen.getByText(/Online payment is not available/)).toBeTruthy()
})

it('reserves a returning purchaser basket once while pending and clears only submitted selections after acceptance', async () => {
  let finish: (value: { ok: true; redirect: string }) => void = () => {}
  mocks.reserve.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  render(
    <CheckoutFlow
      mode="checkout"
      contact={{ name: 'Test Visitor', email: 'visitor@example.test', phone: '+420123456789' }}
    />,
  )
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  const form = screen
    .getByRole('button', { name: 'Reserve and continue to payment' })
    .closest('form')!
  fireEvent.submit(form)
  await waitFor(() => expect(mocks.reserve).toHaveBeenCalledTimes(1))
  fireEvent.submit(form)
  expect(mocks.reserve).toHaveBeenCalledTimes(1)
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify([
      { eventDateId: 123, quantity: 1 },
      { eventDateId: 456, quantity: 2 },
    ]),
  )
  await act(async () => finish({ ok: true, redirect: '/account/checkouts/12' }))
  expect(mocks.push).toHaveBeenCalledWith('/account/checkouts/12')
  expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toEqual([
    { eventDateId: 456, quantity: 2 },
  ])
  expect(mocks.guest).not.toHaveBeenCalled()
})

it('asks for email first and routes any known account to login without collecting new-customer details', async () => {
  mocks.lookup.mockResolvedValueOnce({ ok: true, journey: 'login' })
  mocks.login.mockResolvedValueOnce({ ok: true })
  render(<CheckoutFlow mode="checkout" />)
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  expect(screen.queryByLabelText('Full name')).toBeNull()
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'returning@example.test' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Continue with email' }).closest('form')!)
  const password = await screen.findByLabelText('Password')
  expect(screen.queryByRole('link', { name: 'Sign in to continue to payment' })).toBeNull()
  expect(screen.queryByLabelText('Full name')).toBeNull()
  expect(mocks.guest).not.toHaveBeenCalled()
  expect(mocks.reserve).not.toHaveBeenCalled()
  expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toEqual([
    { eventDateId: 123, quantity: 1 },
  ])
  fireEvent.change(password, { target: { value: 'FixturePassword42!' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in and continue' }).closest('form')!)
  await waitFor(() => expect(mocks.login).toHaveBeenCalledTimes(1))
  expect(mocks.login.mock.calls[0][1].get('email')).toBe('returning@example.test')
  expect(mocks.login.mock.calls[0][1].get('password')).toBe('FixturePassword42!')
  expect(mocks.refresh).toHaveBeenCalledTimes(1)
  expect(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY)!)).toEqual([
    { eventDateId: 123, quantity: 1 },
  ])
})

it('does not ask an authenticated customer for saved billing details again', async () => {
  mocks.reserve.mockResolvedValue({ ok: false, formError: 'Please retry.' })
  render(
    <CheckoutFlow
      mode="checkout"
      contact={{ name: 'Test Customer', email: 'customer@example.test', phone: '+420123456789' }}
    />,
  )
  await screen.findByRole('heading', { name: 'Test climbing trip' })
  expect(screen.queryByLabelText('Payer first name')).toBeNull()
  expect(screen.queryByLabelText('Street and number')).toBeNull()
  fireEvent.submit(
    screen.getByRole('button', { name: 'Reserve and continue to payment' }).closest('form')!,
  )
  await screen.findByText('Please retry.')
  expect(mocks.reserve).toHaveBeenCalledTimes(1)
})
