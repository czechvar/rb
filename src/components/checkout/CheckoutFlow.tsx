'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import type { CheckoutContact } from '@/lib/checkout/types'
import type { CheckoutDisplayQuote } from './presentation'
import type { ActionResult } from '@/components/forms/action-result'
import { quoteCartAction, reserveCheckoutAction } from '@/app/(frontend)/checkout/actions'
import {
  createGuestCheckoutAction,
  lookupCheckoutJourneyAction,
} from '@/app/(frontend)/checkout/identity-actions'
import { useCart } from './useCart'
import { addCartItem, MAX_CART_QUANTITY, readCart } from './cart-storage'
import { money, date } from './format'
import styles from './checkout.module.css'

export function CheckoutFlow({
  mode,
  add,
  contact,
  returning = false,
  initialBilling,
}: {
  mode: 'cart' | 'checkout'
  add?: number
  contact?: CheckoutContact
  returning?: boolean
  initialBilling?: Partial<
    Record<'firstName' | 'lastName' | 'street' | 'city' | 'postalCode' | 'country', string>
  >
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
  const [result, setResult] = useState<ActionResult>({ ok: false })
  const [values, setValues] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    firstName: initialBilling?.firstName || contact?.name.split(' ')[0] || '',
    lastName: initialBilling?.lastName || contact?.name.split(' ').slice(1).join(' ') || '',
    street: initialBilling?.street || '',
    city: initialBilling?.city || '',
    postalCode: initialBilling?.postalCode || '',
    country: initialBilling?.country || '',
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
          maxLength={
            name === 'email'
              ? 254
              : name === 'phone'
                ? 20
                : name === 'street'
                  ? 250
                  : name === 'postalCode'
                    ? 30
                    : name === 'country'
                      ? 100
                      : 120
          }
          readOnly={name === 'email' && !!contact}
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
            if (name === 'email' && !contact) setJourney('unknown')
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
      const response = await (returning ? reserveCheckoutAction : createGuestCheckoutAction)(
        null,
        data,
      )
      setResult(response)
      if (response.ok && response.redirect) {
        if (returning)
          cart.replace(
            readCart()
              .map((item) => ({
                ...item,
                quantity:
                  item.quantity -
                  (submittedItems.find((reserved) => reserved.eventDateId === item.eventDateId)
                    ?.quantity || 0),
              }))
              .filter((item) => item.quantity > 0),
          )
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
  if (!cart.items.length)
    return (
      <div className={styles.panel}>
        <h2>Your cart is empty</h2>
        {cart.storageError && (
          <p role="alert" className={styles.error}>
            Your browser could not save this cart. Enable local storage to add trips.
          </p>
        )}
        <p className={styles.muted}>
          Choose a dated trip to start planning your next days on the rock.
        </p>
        <Link className={styles.button} href="/trips">
          Explore trips
        </Link>
      </div>
    )
  return (
    <div className={styles.layout}>
      <div className={styles.stack}>
        {cart.storageError && (
          <p className={styles.error} role="alert">
            Your browser could not save this cart. Enable local storage before continuing.
          </p>
        )}
        {cart.items.map((item) => {
          const priced = quote?.items.find((row) => row.eventDateId === item.eventDateId)
          return (
            <section className={styles.panel} key={item.eventDateId}>
              <div className={styles.row}>
                <div>
                  <h2>{priced?.title || 'Selected trip'}</h2>
                  {priced && (
                    <p className={styles.muted}>
                      {date(priced.dateFrom)} – {date(priced.dateTo)}
                    </p>
                  )}
                </div>
                <button
                  className={styles.remove}
                  type="button"
                  disabled={pending}
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
                    disabled={pending}
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
        <div className={styles.panel}>
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
                disabled={pending}
              />
            </label>
            <div className={styles.actions}>
              <button className={`${styles.button} ${styles.secondary}`} disabled={pending}>
                Apply code
              </button>
              <Link href="/trips">Add another trip</Link>
            </div>
          </form>
        </div>
        {mode === 'checkout' && (
          <section className={styles.panel}>
            <h2>
              {returning
                ? 'Payer and billing details'
                : !contact && journey === 'unknown'
                  ? 'Start with your email'
                  : 'Your details'}
            </h2>
            <p className={styles.muted}>
              {returning
                ? 'Reserve every date together, then choose full payment or the amount due now. Unpaid returning-customer reservations are held for 24 hours, subject to payment reconciliation.'
                : 'Verify your email before we reserve your dates for review. We will invite you to set up your account and pay once approved.'}
            </p>
            {!contact && (
              <p>
                Booked with us before?{' '}
                <Link href="/login?from=%2Fcheckout">Log in with your password</Link>. Your cart
                stays here.
              </p>
            )}
            <form ref={formRef} onSubmit={submit} aria-busy={pending}>
              {!result.ok && result.formError && (
                <p className={styles.error} role="alert">
                  {result.formError}
                </p>
              )}
              {result.ok && <p role="status">Your request was accepted. Opening the next step…</p>}
              <fieldset className={styles.fields} disabled={pending}>
                <div hidden aria-hidden="true">
                  <label>
                    Website
                    <input name="website" autoComplete="off" tabIndex={-1} />
                  </label>
                </div>
                {field('email', 'Email', 'email')}
                {(contact || journey === 'new') && (
                  <>
                    {field('name', 'Full name')}
                    {field('phone', 'Phone including country code', 'tel')}
                  </>
                )}
                {returning && (
                  <>
                    <div className={styles.formRow}>
                      {field('firstName', 'Payer first name')}
                      {field('lastName', 'Payer last name')}
                    </div>
                    {field('street', 'Street and number')}
                    <div className={styles.formRow}>
                      {field('city', 'City')}
                      {field('postalCode', 'Postal code')}
                    </div>
                    {field('country', 'Country')}
                  </>
                )}
                {journey === 'login' && !contact ? (
                  <p className={styles.notice}>
                    Welcome back.{' '}
                    <Link href="/login?from=%2Fcheckout">
                      Log in with your password to continue
                    </Link>
                    . Your selected trips will stay in your cart.
                  </p>
                ) : (
                  <button
                    className={styles.button}
                    disabled={!quote || pricing || pending || cart.storageError}
                  >
                    {pending
                      ? 'Working…'
                      : returning
                        ? 'Reserve and continue to payment'
                        : !contact && journey === 'unknown'
                          ? 'Continue with email'
                          : 'Send verification email'}
                  </button>
                )}
              </fieldset>
            </form>
          </section>
        )}
      </div>
      <aside className={styles.panel} aria-label="Order summary">
        <h2>Order summary</h2>
        {pricing && <p role="status">Checking current prices and availability…</p>}
        {quoteError && (
          <>
            <p className={styles.error} role="alert">
              {quoteError}
            </p>
            <button
              className={`${styles.button} ${styles.secondary}`}
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
          Adding trips to your cart does not hold places. Availability and prices are checked again
          when reserving.
        </p>
        {mode === 'cart' && (
          <Link className={styles.button} href="/checkout">
            Continue to checkout
          </Link>
        )}
      </aside>
    </div>
  )
}
