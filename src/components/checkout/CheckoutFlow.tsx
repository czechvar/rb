'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import type { CartItem, CheckoutContact } from '@/lib/checkout/types'
import type { CheckoutDisplayQuote } from './presentation'
import type { ActionResult } from '@/components/forms/action-result'
import {
  quoteCartAction,
  reserveCheckoutAction,
  reserveCheckoutForReviewAction,
} from '@/app/(frontend)/checkout/actions'
import {
  completeGuestPaymentAction,
  completeGuestReservationAction,
  createGuestCheckoutAction,
  loginCheckoutAction,
  lookupCheckoutJourneyAction,
  validateGuestCheckoutAction,
} from '@/app/(frontend)/checkout/identity-actions'
import { useCart } from './useCart'
import { addCartItem, MAX_CART_QUANTITY, readCart } from './cart-storage'
import { money, date } from './format'
import styles from './checkout.module.css'

function subtractSubmittedCart(submittedItems: CartItem[]) {
  return readCart()
    .map((item) => ({
      ...item,
      quantity:
        item.quantity -
        (submittedItems.find((reserved) => reserved.eventDateId === item.eventDateId)?.quantity ||
          0),
    }))
    .filter((item) => item.quantity > 0)
}

export function CheckoutFlow({
  mode,
  add,
  contact,
  intent = 'pay',
}: {
  mode: 'cart' | 'checkout'
  add?: number
  contact?: CheckoutContact
  intent?: 'pay' | 'reserve'
}) {
  const cart = useCart()
  const router = useRouter()
  const id = useId()
  const added = useRef<number | null>(null)
  const submissionKey = useRef<string | null>(null)
  const submitting = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [priced, setPriced] = useState<{
    key: string
    quote: CheckoutDisplayQuote | null
    error: string
  }>({ key: '', quote: null, error: '' })
  const [discount, setDiscount] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [journey, setJourney] = useState<'unknown' | 'login' | 'new'>(contact ? 'new' : 'unknown')
  const [pending, setPending] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [result, setResult] = useState<ActionResult>({ ok: false })
  const [guestVerification, setGuestVerification] = useState<{
    checkoutId: number
    items: typeof cart.items
    code?: string
    verified: boolean
  } | null>(null)
  const [guestReserved, setGuestReserved] = useState(false)
  const cartEditingLocked = pending || Boolean(guestVerification)
  const checkoutStep = contact ? 2 : journey === 'login' || guestVerification?.verified ? 1 : 0
  const checkoutSteps =
    intent === 'pay' ? ['Verify', 'Account', 'Payment'] : ['Verify', 'Details', 'Review']
  const [values, setValues] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
  })
  useEffect(() => {
    if (!add) added.current = null
    if (cart.ready && add && added.current !== add) {
      added.current = add
      cart.replace(addCartItem(cart.items, add))
      router.replace(mode === 'cart' ? '/cart' : '/checkout', { scroll: false })
    }
  }, [cart.ready, add, cart, router, mode])
  const selections = JSON.stringify(cart.items)
  const quoteKey = JSON.stringify([selections, appliedDiscount, refresh])
  const quote = priced.key === quoteKey ? priced.quote : null
  const quoteError = priced.key === quoteKey ? priced.error : ''
  const pricing = cart.ready && cart.items.length > 0 && priced.key !== quoteKey
  useEffect(() => {
    submissionKey.current = null
  }, [selections, appliedDiscount])
  useEffect(() => {
    if (!cart.ready || !cart.items.length) return
    let active = true
    quoteCartAction({ items: cart.items, discountCode: appliedDiscount })
      .then((response) => {
        if (!active) return
        setPriced({
          key: quoteKey,
          quote: response.ok ? response.quote : null,
          error: response.ok ? '' : response.error,
        })
      })
      .catch(() => {
        if (active)
          setPriced({
            key: quoteKey,
            quote: null,
            error: 'Prices could not be checked. Please try again.',
          })
      })
    return () => {
      active = false
    }
    // Selection-only storage is the dependency; hook object identities are intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey, cart.ready])
  useEffect(() => {
    if (!result.ok && result.fieldErrors)
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [result])
  const errors = !result.ok ? result.fieldErrors : undefined
  function field(name: keyof typeof values, label: string, type = 'text', required = true) {
    return (
      <label className={styles.field} htmlFor={`${id}-${name}`}>
        {label}
        <input
          id={`${id}-${name}`}
          name={name}
          type={type}
          value={values[name]}
          required={required}
          maxLength={name === 'email' ? 254 : name === 'phone' ? 20 : 120}
          readOnly={name === 'email' && (!!contact || Boolean(guestVerification))}
          aria-invalid={errors?.[name] ? true : undefined}
          aria-describedby={errors?.[name] ? `${id}-${name}-error` : undefined}
          autoComplete={
            name === 'name'
              ? 'name'
              : name === 'email'
                ? 'email'
                : name === 'phone'
                  ? 'tel'
                  : undefined
          }
          onChange={(event) => {
            submissionKey.current = null
            if (name === 'email' && !contact) {
              setJourney('unknown')
              setPassword('')
            }
            setValues((current) => ({ ...current, [name]: event.target.value }))
          }}
        />
        {errors?.[name] && (
          <span className={styles.error} id={`${id}-${name}-error`}>
            {errors[name]}
          </span>
        )}
      </label>
    )
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (guestVerification) {
      if (submitting.current) return
      submitting.current = true
      const data = new FormData(event.currentTarget)
      data.set('checkout', String(guestVerification.checkoutId))
      setPending(true)
      setResult({ ok: false })
      try {
        const response = guestVerification.verified
          ? await (intent === 'pay' ? completeGuestPaymentAction : completeGuestReservationAction)(
              null,
              data,
            )
          : await validateGuestCheckoutAction(null, data)
        setResult(response)
        if (response.ok) {
          if (!guestVerification.verified) {
            setGuestVerification({
              ...guestVerification,
              code: String(data.get('code') ?? ''),
              verified: true,
            })
          } else {
            cart.replace(subtractSubmittedCart(guestVerification.items))
            if ('redirect' in response && response.redirect) router.push(response.redirect)
            else setGuestReserved(true)
          }
        }
      } catch {
        setResult({
          ok: false,
          formError: 'Your request could not be completed. Your cart is saved; please try again.',
        })
      } finally {
        setPending(false)
        submitting.current = false
      }
      return
    }
    if (!contact && journey === 'login') {
      if (submitting.current) return
      submitting.current = true
      const data = new FormData(event.currentTarget)
      setPending(true)
      setResult({ ok: false })
      try {
        const response = await loginCheckoutAction(null, data)
        setResult(response)
        setPassword('')
        if (response.ok) router.refresh()
      } catch {
        setResult({ ok: false, formError: 'Sign-in could not be completed. Please try again.' })
        setPassword('')
      } finally {
        setPending(false)
        submitting.current = false
      }
      return
    }
    if (submitting.current || !quote || pricing) return
    submitting.current = true
    const data = new FormData(event.currentTarget)
    const submittedItems = cart.items
    data.set('items', JSON.stringify(submittedItems))
    data.set('discountCode', appliedDiscount)
    setPending(true)
    setResult({ ok: false })
    try {
      if (!contact && journey !== 'new') {
        const response = await lookupCheckoutJourneyAction(values.email)
        if (response.ok) setJourney(response.journey)
        else setResult({ ok: false, formError: response.error })
        return
      }
      submissionKey.current ??= crypto.randomUUID()
      data.set('submissionKey', submissionKey.current)
      const response = await (
        contact
          ? intent === 'pay'
            ? reserveCheckoutAction
            : reserveCheckoutForReviewAction
          : createGuestCheckoutAction
      )(null, data)
      setResult(response)
      if (response.ok && 'checkoutId' in response) {
        setGuestVerification({
          checkoutId: response.checkoutId,
          items: submittedItems,
          verified: false,
        })
        return
      }
      if (response.ok && response.redirect) {
        if (contact) cart.replace(subtractSubmittedCart(submittedItems))
        router.push(response.redirect)
      }
    } catch {
      setResult({
        ok: false,
        formError: 'Your request could not be completed. Your cart is saved; please try again.',
      })
    } finally {
      setPending(false)
      submitting.current = false
    }
  }
  if (!cart.ready) return <p role="status">Loading your cart…</p>
  if (guestReserved)
    return (
      <div className={styles.panel} role="status">
        <h2 data-type="card-lg">Your trips are reserved for review</h2>
        <p className={styles.muted}>
          We have received your request and will email you when it is approved and ready for
          payment.
        </p>
        <Link className={`btn-primary ${styles.button}`} href="/trips">
          Explore more trips
        </Link>
      </div>
    )
  if (!cart.items.length)
    return (
      <div className={styles.panel}>
        <h2 data-type="card-lg">Your cart is empty</h2>
        {cart.storageError && (
          <p role="alert" className={styles.error}>
            Your browser could not save this cart. Enable local storage to add trips.
          </p>
        )}
        <p className={styles.muted}>
          Choose a dated trip to start planning your next days on the rock.
        </p>
        <Link className={`btn-primary ${styles.button}`} href="/trips">
          Explore trips
        </Link>
      </div>
    )
  function renderOrderDetails() {
    return (
      <>
        {cart.items.map((item) => {
          const priced = quote?.items.find((row) => row.eventDateId === item.eventDateId)
          return (
            <section className={`${styles.panel} ${styles.cartPanel}`} key={item.eventDateId}>
              <div className={styles.row}>
                <div>
                  <h2 data-type="card-lg">{priced?.title || 'Selected trip'}</h2>
                  {priced && (
                    <p className={styles.muted}>
                      {date(priced.dateFrom)} – {date(priced.dateTo)}
                    </p>
                  )}
                </div>
                <button
                  className={styles.remove}
                  type="button"
                  disabled={cartEditingLocked}
                  onClick={() =>
                    cart.replace(cart.items.filter((row) => row.eventDateId !== item.eventDateId))
                  }
                >
                  Remove
                </button>
              </div>
              <div className={styles.formRow}>
                <label className={styles.field}>
                  Participants
                  <input
                    type="number"
                    min={1}
                    max={MAX_CART_QUANTITY}
                    value={item.quantity}
                    disabled={cartEditingLocked}
                    onChange={(event) => {
                      const quantity = Number(event.target.value)
                      if (
                        Number.isInteger(quantity) &&
                        quantity > 0 &&
                        quantity <= MAX_CART_QUANTITY
                      )
                        cart.replace(
                          cart.items.map((row) =>
                            row.eventDateId === item.eventDateId ? { ...row, quantity } : row,
                          ),
                        )
                    }}
                  />
                </label>
                {priced && (
                  <div className={styles.row}>
                    <span>Trip total</span>
                    <strong>{money(priced.totalMinor, priced.currency)}</strong>
                  </div>
                )}
              </div>
              {priced && (
                <p className={styles.muted}>
                  Balance due {date(priced.balanceDueAt)}.{' '}
                  {money(priced.unitMinor, priced.currency)} per participant.
                </p>
              )}
            </section>
          )
        })}
        <div className={`${styles.panel} ${styles.cartPanel}`}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setAppliedDiscount(discount.trim())
              setRefresh((value) => value + 1)
            }}
          >
            <label className={styles.field}>
              Discount code (optional)
              <input
                value={discount}
                maxLength={80}
                onChange={(event) => setDiscount(event.target.value)}
                disabled={cartEditingLocked}
              />
            </label>
            <div className={styles.actions}>
              <button className={`btn-ghost ${styles.button}`} disabled={cartEditingLocked}>
                Apply code
              </button>
              {!guestVerification && <Link href="/trips">Add another trip</Link>}
            </div>
          </form>
        </div>
      </>
    )
  }
  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        {cart.storageError && (
          <p className={styles.error} role="alert">
            Your browser could not save this cart. Enable local storage before continuing.
          </p>
        )}
        {mode === 'cart' && renderOrderDetails()}
        {mode === 'checkout' && (
          <section className={`${styles.panel} ${styles.primaryPanel}`}>
            <ol className={styles.progress} aria-label="Checkout progress">
              {checkoutSteps.map((step, index) => (
                <li
                  className={styles.progressStep}
                  data-state={
                    index < checkoutStep
                      ? 'complete'
                      : index === checkoutStep
                        ? 'current'
                        : 'upcoming'
                  }
                  aria-current={index === checkoutStep ? 'step' : undefined}
                  key={step}
                >
                  <span aria-hidden="true">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <h2 data-type="card-lg">
              {contact
                ? `${intent === 'pay' ? 'Pay now' : 'Reserve now'}${contact.name ? `, ${contact.name}` : ''}`
                : journey === 'login'
                  ? 'Sign in to continue'
                  : guestVerification?.verified
                    ? intent === 'pay'
                      ? 'Create your account'
                      : 'Your details'
                    : 'Verify your email'}
            </h2>
            <p className={styles.muted}>
              {contact
                ? 'Reserve every date together, then choose full payment or the amount due now. Unpaid reservations are held for 24 hours, subject to payment reconciliation.'
                : journey === 'login'
                  ? `We found an account for this email. Sign in to ${intent === 'pay' ? 'continue to payment' : 'reserve your trips for review'}.`
                  : guestVerification?.verified
                    ? intent === 'pay'
                      ? 'Add your details and choose a password, then continue directly to payment.'
                      : 'Add your contact details, then send your reservation for review.'
                    : guestVerification
                      ? 'Enter the six-digit code from your email to continue.'
                      : journey === 'new'
                        ? 'Send a six-digit code to confirm this email before adding your details.'
                        : 'Enter your email to begin. We will check whether you already have an account.'}
            </p>
            <form ref={formRef} onSubmit={submit} aria-busy={pending}>
              {!result.ok && result.formError && (
                <p className={styles.error} role="alert">
                  {result.formError}
                </p>
              )}
              {result.ok && !guestVerification && !contact && (
                <p role="status">
                  {journey === 'login'
                    ? 'Signed in. Continuing with your checkout…'
                    : 'Your request was accepted. Opening the next step…'}
                </p>
              )}
              <fieldset className={styles.fields} disabled={pending}>
                <div hidden aria-hidden="true">
                  <label>
                    Website
                    <input name="website" autoComplete="off" tabIndex={-1} />
                  </label>
                </div>
                {guestVerification && !guestVerification.verified ? (
                  <>
                    <p className={styles.notice} role="status">
                      <strong>
                        We emailed a six-digit verification code to {values.email}. Enter it below
                        to continue.
                      </strong>
                    </p>
                    <label className={styles.field} htmlFor={`${id}-code`}>
                      Verification code
                      <input
                        id={`${id}-code`}
                        name="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={6}
                        pattern="[0-9]{6}"
                        required
                      />
                    </label>
                    <button className={`btn-primary ${styles.button}`}>Verify email</button>
                  </>
                ) : (
                  <>
                    {!contact && field('email', 'Email', 'email')}
                    {journey === 'login' && !contact && (
                      <label className={styles.field} htmlFor={`${id}-password`}>
                        Password
                        <input
                          id={`${id}-password`}
                          name="password"
                          type="password"
                          value={password}
                          required
                          maxLength={128}
                          autoComplete="current-password"
                          aria-invalid={errors?.password ? true : undefined}
                          aria-describedby={errors?.password ? `${id}-password-error` : undefined}
                          onChange={(event) => setPassword(event.target.value)}
                        />
                        {errors?.password && (
                          <span className={styles.error} id={`${id}-password-error`}>
                            {errors.password}
                          </span>
                        )}
                      </label>
                    )}
                    {!contact && guestVerification?.verified && (
                      <>
                        {field('name', 'Full name')}
                        {field(
                          'phone',
                          intent === 'pay'
                            ? 'Phone including country code'
                            : 'Phone including country code (optional)',
                          'tel',
                          intent === 'pay',
                        )}
                        {intent === 'pay' && (
                          <>
                            <label className={styles.field} htmlFor={`${id}-new-password`}>
                              Choose a password
                              <input
                                id={`${id}-new-password`}
                                name="password"
                                type="password"
                                value={password}
                                required
                                minLength={8}
                                maxLength={128}
                                autoComplete="new-password"
                                onChange={(event) => setPassword(event.target.value)}
                              />
                            </label>
                            <label className={styles.field} htmlFor={`${id}-password-confirm`}>
                              Confirm password
                              <input
                                id={`${id}-password-confirm`}
                                name="passwordConfirm"
                                type="password"
                                value={passwordConfirm}
                                required
                                minLength={8}
                                maxLength={128}
                                autoComplete="new-password"
                                onChange={(event) => setPasswordConfirm(event.target.value)}
                              />
                            </label>
                          </>
                        )}
                        <input type="hidden" name="checkout" value={guestVerification.checkoutId} />
                        <input type="hidden" name="code" value={guestVerification.code} />
                      </>
                    )}
                  </>
                )}
                {!guestVerification && journey === 'login' && !contact ? (
                  <>
                    <button
                      className={`btn-primary ${styles.button}`}
                      disabled={pending || cart.storageError}
                    >
                      {pending ? 'Signing in…' : 'Sign in and continue'}
                    </button>
                    <p className={styles.notice}>
                      <Link href="/forgot-password">Forgot your password?</Link> Your selected trips
                      will stay in your cart.
                    </p>
                  </>
                ) : guestVerification?.verified ? (
                  <button
                    className={`btn-primary ${styles.button}`}
                    disabled={pending || cart.storageError}
                  >
                    {pending
                      ? 'Working…'
                      : intent === 'pay'
                        ? 'Register and continue to payment'
                        : 'Reserve now'}
                  </button>
                ) : !guestVerification ? (
                  <button
                    className={`btn-primary ${styles.button}`}
                    disabled={!quote || pricing || pending || cart.storageError}
                  >
                    {pending
                      ? 'Working…'
                      : contact
                        ? intent === 'pay'
                          ? 'Continue to payment'
                          : 'Reserve now'
                        : journey === 'unknown'
                          ? 'Continue with email'
                          : 'Send verification code'}
                  </button>
                ) : null}
              </fieldset>
            </form>
          </section>
        )}
      </div>
      <aside className={styles.sidebar} aria-label="Order summary">
        {mode === 'checkout' && (
          <details className={styles.orderDetails}>
            <summary>
              <span>Order details</span>
              <span className={styles.orderDetailCount}>
                {cart.items.length} {cart.items.length === 1 ? 'trip' : 'trips'}
              </span>
            </summary>
            <div className={styles.orderDetailsContent}>{renderOrderDetails()}</div>
          </details>
        )}
        <section className={styles.panel}>
          <h2 data-type="card-lg">Order summary</h2>
          {pricing && <p role="status">Checking current prices and availability…</p>}
          {quoteError && (
            <>
              <p className={styles.error} role="alert">
                {quoteError}
              </p>
              <button
                className={`btn-ghost ${styles.button}`}
                onClick={() => setRefresh((value) => value + 1)}
              >
                Check again
              </button>
            </>
          )}
          {quote && (
            <>
              <div className={`${styles.row} ${styles.total}`}>
                <span>Total</span>
                <span>{money(quote.totalMinor, quote.currency)}</span>
              </div>
              <div className={styles.row}>
                <span>Initial payment after reservation</span>
                <strong>{money(quote.initialMinor, quote.currency)}</strong>
              </div>
              <p className={styles.muted}>
                25% deposit where available. Departures within 30 days require full payment. Each
                remaining balance is due 30 days before its trip.
              </p>
              {quote.benefitEligible && (
                <p className={styles.muted}>This cart can be paid with Benefit+ in CZK.</p>
              )}
            </>
          )}
          <p className={styles.muted}>
            Adding trips to your cart does not hold places. Availability and prices are checked
            again when reserving.
          </p>
          {mode === 'cart' && (
            <div className={styles.checkoutActions}>
              <Link className={`btn-primary ${styles.button}`} href="/checkout?intent=pay">
                Pay now
              </Link>
              <Link
                className={`btn-ghost ${styles.button}`}
                data-button="secondary"
                href="/checkout?intent=reserve"
              >
                Reserve now
              </Link>
            </div>
          )}
        </section>
      </aside>
    </div>
  )
}
