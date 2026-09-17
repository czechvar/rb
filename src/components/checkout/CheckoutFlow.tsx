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
  const [discountDraft, setDiscountDraft] = useState<string | null>(null)
  const [discountNotice, setDiscountNotice] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [journey, setJourney] = useState<'unknown' | 'login' | 'new'>(contact ? 'new' : 'unknown')
  const [pending, setPending] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false)
  const [result, setResult] = useState<ActionResult>({ ok: false })
  const [guestVerification, setGuestVerification] = useState<{
    checkoutId: number
    items: typeof cart.items
    submissionKey: string
    discountCode: string
    code?: string
    verified: boolean
  } | null>(null)
  const [guestReserved, setGuestReserved] = useState(false)
  const [resend, setResend] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
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
  const appliedDiscount = cart.discountCode
  const discount = discountDraft ?? appliedDiscount
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
        if (!response.ok && response.discountRejected && appliedDiscount) {
          // Clearing the code changes the quote key, so the cart re-prices without it.
          cart.applyDiscount('')
          // Keep the rejected text visible unless the customer is already typing a correction.
          setDiscountDraft((draft) => draft ?? appliedDiscount)
          setDiscountNotice(response.error)
          return
        }
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
    const verified = name === 'email' && Boolean(guestVerification?.verified)
    const helperId =
      name === 'email' && !contact && !guestVerification && journey === 'unknown'
        ? `${id}-email-help`
        : undefined
    return (
      <label className={styles.field} htmlFor={`${id}-${name}`}>
        {label}
        <span className={verified ? styles.verifiedInput : undefined}>
          <input
            id={`${id}-${name}`}
            name={name}
            type={type}
            value={values[name]}
            required={required}
            maxLength={name === 'email' ? 254 : name === 'phone' ? 20 : 120}
            readOnly={name === 'email' && (!!contact || Boolean(guestVerification))}
            autoFocus={name === 'email' && !contact && !guestVerification && journey === 'unknown'}
            aria-invalid={errors?.[name] ? true : undefined}
            aria-describedby={
              [errors?.[name] ? `${id}-${name}-error` : '', helperId].filter(Boolean).join(' ') ||
              undefined
            }
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
          {verified && (
            <span className={styles.verifiedBadge} role="status" aria-label="Verified" />
          )}
        </span>
        {errors?.[name] && (
          <span className={styles.error} id={`${id}-${name}-error`}>
            {errors[name]}
          </span>
        )}
      </label>
    )
  }
  /** Re-submitting the same submission key reissues the code for the existing unverified checkout. */
  async function resendCode() {
    if (!guestVerification || guestVerification.verified || submitting.current) return
    submitting.current = true
    const data = new FormData()
    data.set('email', values.email)
    data.set('items', JSON.stringify(guestVerification.items))
    data.set('discountCode', guestVerification.discountCode)
    data.set('submissionKey', guestVerification.submissionKey)
    setResend('sending')
    try {
      const response = await createGuestCheckoutAction(null, data)
      setResend(response.ok ? 'sent' : 'failed')
    } catch {
      setResend('failed')
    } finally {
      submitting.current = false
    }
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
            cart.applyDiscount('')
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
        if (!response.ok) {
          setResult({ ok: false, formError: response.error })
          return
        }
        setJourney(response.journey)
        if (response.journey === 'login') return
      }
      const key = (submissionKey.current ??= crypto.randomUUID())
      data.set('submissionKey', key)
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
          submissionKey: key,
          discountCode: appliedDiscount,
          verified: false,
        })
        return
      }
      if (response.ok && response.redirect) {
        if (contact) {
          cart.replace(subtractSubmittedCart(submittedItems))
          cart.applyDiscount('')
        }
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
            <section className={styles.panel} key={item.eventDateId}>
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
                {priced && cart.items.length > 1 && (
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
              cart.applyDiscount(discount)
              setDiscountDraft(null)
              setDiscountNotice('')
              setRefresh((value) => value + 1)
            }}
          >
            <label className={styles.field}>
              Discount code (optional)
              <input
                value={discount}
                maxLength={80}
                onChange={(event) => setDiscountDraft(event.target.value)}
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
  function renderTripSummary() {
    return (
      <section
        className={`${styles.panel} ${styles.tripSummary}`}
        aria-labelledby={`${id}-trip-title`}
      >
        <div className={styles.tripSummaryHeading}>
          <h2 id={`${id}-trip-title`} data-type="card-lg">
            Your trip
          </h2>
          <span className={styles.orderDetailCount}>
            {cart.items.length} {cart.items.length === 1 ? 'trip' : 'trips'}
            {!cartEditingLocked && (
              <>
                {' · '}
                <Link href="/cart">Edit cart</Link>
              </>
            )}
          </span>
        </div>
        <div className={styles.tripSummaryContent}>
          {cart.items.map((item) => {
            const priced = quote?.items.find((row) => row.eventDateId === item.eventDateId)
            return (
              <div className={styles.tripSummaryItem} key={item.eventDateId}>
                <h3 className={styles.tripSummaryItemTitle} data-type="card-lg">
                  {priced?.title || 'Selected trip'}
                </h3>
                {priced && (
                  <p className={styles.muted}>
                    {date(priced.dateFrom)} – {date(priced.dateTo)}
                  </p>
                )}
                <p className={styles.muted}>
                  {item.quantity} {item.quantity === 1 ? 'participant' : 'participants'} · Guided
                  trip
                </p>
              </div>
            )
          })}
        </div>
      </section>
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
                  <span aria-hidden="true">{index < checkoutStep ? '✓' : index + 1}</span>
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
                        ? pending
                          ? 'Sending a six-digit code to confirm this email…'
                          : 'Send a six-digit code to confirm this email before adding your details.'
                        : 'Enter your email to begin. We will check whether you already have an account.'}
            </p>
            <form
              className={styles.checkoutForm}
              ref={formRef}
              onSubmit={submit}
              aria-busy={pending}
            >
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
                    <p className={styles.helper}>
                      <span role="status">
                        {resend === 'sent'
                          ? 'We sent a new code. Only the newest code works. '
                          : resend === 'failed'
                            ? 'We could not send a new code yet. Please wait a few minutes and try again. '
                            : ''}
                      </span>
                      Didn’t get the code? Check your spam folder or{' '}
                      <button
                        type="button"
                        className={styles.inlineButton}
                        disabled={resend === 'sending'}
                        onClick={resendCode}
                      >
                        {resend === 'sending' ? 'sending a new code…' : 'click here to resend'}
                      </button>
                      .
                    </p>
                  </>
                ) : (
                  <>
                    {!contact && field('email', 'Email', 'email')}
                    {!contact && !guestVerification && journey === 'unknown' && (
                      <p className={styles.helper} id={`${id}-email-help`}>
                        We use your email to find your account or send a verification code.
                      </p>
                    )}
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
                        <div className={styles.formRow}>
                          {field('name', 'Full name')}
                          <label className={styles.field} htmlFor={`${id}-phone`}>
                            <span>Phone number{intent === 'reserve' ? ' (optional)' : ''}</span>
                            <input
                              id={`${id}-phone`}
                              name="phone"
                              type="tel"
                              value={values.phone}
                              required={intent === 'pay'}
                              maxLength={20}
                              placeholder="+34 600 000 000"
                              autoComplete="tel"
                              aria-label={
                                intent === 'pay'
                                  ? 'Phone including country code'
                                  : 'Phone including country code (optional)'
                              }
                              aria-invalid={errors?.phone ? true : undefined}
                              aria-describedby={errors?.phone ? `${id}-phone-error` : undefined}
                              onChange={(event) => {
                                submissionKey.current = null
                                setValues((current) => ({ ...current, phone: event.target.value }))
                              }}
                            />
                            {errors?.phone && (
                              <span className={styles.error} id={`${id}-phone-error`}>
                                {errors.phone}
                              </span>
                            )}
                          </label>
                        </div>
                        {intent === 'pay' && (
                          <>
                            <div className={styles.formRow}>
                              <label className={styles.field} htmlFor={`${id}-new-password`}>
                                Create a password
                                <span className={styles.passwordInput}>
                                  <input
                                    id={`${id}-new-password`}
                                    name="password"
                                    type={passwordVisible ? 'text' : 'password'}
                                    value={password}
                                    required
                                    minLength={8}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    onChange={(event) => setPassword(event.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    aria-pressed={passwordVisible}
                                    onClick={() => setPasswordVisible((visible) => !visible)}
                                  >
                                    {passwordVisible ? 'Hide' : 'Show'}
                                  </button>
                                </span>
                              </label>
                              <label className={styles.field} htmlFor={`${id}-password-confirm`}>
                                Confirm password
                                <span className={styles.passwordInput}>
                                  <input
                                    id={`${id}-password-confirm`}
                                    name="passwordConfirm"
                                    type={passwordConfirmVisible ? 'text' : 'password'}
                                    value={passwordConfirm}
                                    required
                                    minLength={8}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    onChange={(event) => setPasswordConfirm(event.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    aria-pressed={passwordConfirmVisible}
                                    onClick={() => setPasswordConfirmVisible((visible) => !visible)}
                                  >
                                    {passwordConfirmVisible ? 'Hide' : 'Show'}
                                  </button>
                                </span>
                              </label>
                            </div>
                            <p className={styles.helper}>
                              Use at least 8 characters. You can use this account to manage future
                              bookings.
                            </p>
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
                        ? 'Create account and continue'
                        : 'Reserve now'}
                  </button>
                ) : journey === 'new' && pending ? (
                  <p role="status" className={styles.notice}>
                    Sending verification code…
                  </p>
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
        {mode === 'checkout' && renderTripSummary()}
        <section className={styles.panel}>
          <h2 data-type="card-lg">Order summary</h2>
          {pricing && <p role="status">Checking current prices and availability…</p>}
          {discountNotice && (
            <p className={styles.error} role="alert">
              {discountNotice}
            </p>
          )}
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
                <span className={styles.totalAmount}>
                  {money(quote.totalMinor, quote.currency)}
                </span>
              </div>
              {quote.initialMinor < quote.totalMinor && (
                <div className={`${styles.row} ${styles.due}`}>
                  <strong>{intent === 'pay' ? 'Due today' : 'Due after approval'}</strong>
                  <strong className={styles.dueAmount}>
                    {money(quote.initialMinor, quote.currency)}
                  </strong>
                </div>
              )}
              <p className={styles.summaryCopy}>
                Departures within 30 days require full payment. When available, deposits start at
                25%; remaining balances are due 30 days before each trip.
              </p>
              {quote.benefitEligible && (
                <p className={styles.muted}>This cart can be paid with Benefit+ in CZK.</p>
              )}
            </>
          )}
          <p className={`${styles.muted} ${styles.summaryNote}`}>
            {mode === 'checkout'
              ? 'Your place is held for 24 hours after reservation. Prices and availability are confirmed before payment.'
              : 'Adding trips to your cart does not hold places. Availability and prices are checked again when reserving.'}
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
