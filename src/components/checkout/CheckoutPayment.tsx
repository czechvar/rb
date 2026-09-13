'use client'
import { useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CheckoutCurrency, CheckoutMethod, CheckoutState } from '@/lib/checkout/types'
import {
  payCheckoutAction,
  cancelCheckoutAction,
  saveCheckoutBillingAction,
} from '@/app/(frontend)/checkout/actions'
import type { CheckoutDisplayItem } from './presentation'
import { money, date } from './format'
import styles from './checkout.module.css'

type Props = {
  checkoutId: number
  state: CheckoutState
  currency: CheckoutCurrency
  items: CheckoutDisplayItem[]
  paymentMethod?: CheckoutMethod | null
  methods: { card: boolean; benefit: boolean }
  billingReady?: boolean
  asOf: number
}
export function CheckoutPayment({
  checkoutId,
  state,
  currency,
  items,
  paymentMethod,
  methods,
  billingReady = false,
  asOf,
}: Props) {
  const router = useRouter()
  const [method, setMethod] = useState<CheckoutMethod>(
    paymentMethod ||
      (methods.card ||
      !methods.benefit ||
      items.some((item) => item.totalCzkMinor == null || item.depositCzkMinor == null)
        ? 'comgate-card'
        : 'muzapay'),
  )
  const [purpose, setPurpose] = useState('full')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const paid =
    Boolean(paymentMethod) || items.some((item) => item.paidMinor > 0 || item.paidCzkMinor > 0)
  const paymentCurrency = method === 'muzapay' ? 'CZK' : currency
  const itemOutstanding = (item: CheckoutDisplayItem) =>
    Math.max(
      0,
      method === 'muzapay'
        ? (item.totalCzkMinor || 0) - item.paidCzkMinor
        : item.totalMinor - item.paidMinor,
    )
  const remaining = items.reduce((sum, item) => sum + itemOutstanding(item), 0)
  const initial = items.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        (new Date(item.balanceDueAt).getTime() <= asOf
          ? method === 'muzapay'
            ? item.totalCzkMinor || 0
            : item.totalMinor
          : method === 'muzapay'
            ? item.depositCzkMinor || 0
            : item.depositMinor) - (method === 'muzapay' ? item.paidCzkMinor : item.paidMinor),
      ),
    0,
  )
  const benefitEligible = items.every(
    (item) => item.totalCzkMinor != null && item.depositCzkMinor != null,
  )
  const card = methods.card && (!paid || !paymentMethod || paymentMethod === 'comgate-card')
  const benefit =
    methods.benefit && benefitEligible && (!paid || !paymentMethod || paymentMethod === 'muzapay')
  const active = state === 'reserved' || state === 'approved'
  async function submit(event: React.FormEvent<HTMLFormElement>, cancel = false) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    const data = new FormData(event.currentTarget)
    data.set('checkoutId', String(checkoutId))
    setPending(true)
    setError('')
    try {
      const response = await (cancel ? cancelCheckoutAction : payCheckoutAction)(null, data)
      if (!response.ok) setError(response.formError || 'Please try again.')
      else if (response.redirect) window.location.assign(response.redirect)
      else router.refresh()
    } catch {
      setError('The request could not be completed. Please try again.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <div className={styles.stack}>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {active && remaining > 0 && !billingReady && <BillingForm checkoutId={checkoutId} />}
      {active && remaining > 0 && billingReady && (
        <section className={styles.panel}>
          <h2>Payment</h2>
          <p className={styles.muted}>
            Payments are confirmed from the provider. Returning to this page alone does not confirm
            payment.
          </p>
          {card || benefit ? (
            <form onSubmit={submit}>
              <fieldset className={styles.fields} disabled={pending}>
                <label className={styles.field}>
                  Payment method
                  <select
                    name="method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as CheckoutMethod)}
                  >
                    {card && <option value="comgate-card">Card — Comgate</option>}
                    {benefit && <option value="muzapay">Benefit+</option>}
                  </select>
                </label>
                {paid && (
                  <p className={styles.muted}>
                    Use the same payment method as your first settled payment.
                  </p>
                )}
                <label className={styles.choice}>
                  <input
                    type="radio"
                    name="purpose"
                    value="full"
                    checked={purpose === 'full'}
                    onChange={() => setPurpose('full')}
                  />
                  <span>
                    Pay outstanding total
                    <strong className={styles.amount}> {money(remaining, paymentCurrency)}</strong>
                  </span>
                </label>
                {!paid && initial > 0 && initial < remaining && (
                  <label className={styles.choice}>
                    <input
                      type="radio"
                      name="purpose"
                      value="deposit"
                      checked={purpose === 'deposit'}
                      onChange={() => setPurpose('deposit')}
                    />
                    <span>
                      Pay the initial amount
                      <strong className={styles.amount}> {money(initial, paymentCurrency)}</strong>
                      <small>
                        25% where available; trips due within 30 days are payable in full.
                      </small>
                    </span>
                  </label>
                )}
                {paid && (
                  <label className={styles.choice}>
                    <input
                      type="radio"
                      name="purpose"
                      value="balance"
                      checked={purpose === 'balance'}
                      onChange={() => setPurpose('balance')}
                    />
                    <span>
                      Pay selected trip balances<small>Select the trips below.</small>
                    </span>
                  </label>
                )}
                {purpose === 'balance' &&
                  items
                    .filter((item) => itemOutstanding(item) > 0)
                    .map((item) => (
                      <label className={styles.choice} key={item.eventDateId}>
                        <input
                          type="checkbox"
                          name="itemIds"
                          value={item.eventDateId}
                          defaultChecked
                        />
                        <span>
                          {item.title} — {money(itemOutstanding(item), paymentCurrency)}
                          <small>Due {date(item.balanceDueAt)}</small>
                        </span>
                      </label>
                    ))}
                {method === 'muzapay' && (
                  <p className={styles.muted}>
                    Benefit+ payments are charged in CZK. Outstanding total:{' '}
                    {money(
                      items.reduce(
                        (sum, item) =>
                          sum + Math.max(0, (item.totalCzkMinor || 0) - item.paidCzkMinor),
                        0,
                      ),
                      'CZK',
                    )}
                    .
                  </p>
                )}
                <button className={styles.button}>
                  {pending ? 'Opening payment…' : 'Continue to secure payment'}
                </button>
              </fieldset>
            </form>
          ) : (
            <p className={styles.notice}>
              Online payment is not available for this reservation at the moment. Please contact us
              for the next step.
            </p>
          )}
        </section>
      )}
      {active && remaining <= 0 && <p className={styles.notice}>Your checkout is paid in full.</p>}
      {!paid && (state === 'reserved' || state === 'approved' || state === 'awaitingReview') && (
        <form onSubmit={(event) => submit(event, true)}>
          <p className={styles.muted}>
            Cancelling releases the reservation. Any settled payment requires staff reconciliation.
          </p>
          <button disabled={pending} className={`${styles.button} ${styles.secondary}`}>
            Cancel reservation
          </button>
        </form>
      )}
      {paid && (
        <p className={styles.muted}>
          Need to cancel or discuss a payment? <Link href="/contact">Contact us</Link> so we can
          review it with you.
        </p>
      )}
    </div>
  )
}

function BillingForm({ checkoutId }: { checkoutId: number }) {
  const router = useRouter()
  const id = useId()
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  return (
    <section className={styles.panel}>
      <h2>Payer address</h2>
      <p className={styles.muted}>Complete your billing details before opening payment.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (busy.current) return
          busy.current = true
          const data = new FormData(event.currentTarget)
          data.set('checkoutId', String(checkoutId))
          setPending(true)
          setError('')
          try {
            const result = await saveCheckoutBillingAction(null, data)
            if (result.ok) router.refresh()
            else setError(result.formError || 'Please check your billing details.')
          } catch {
            setError('Your address could not be saved. Please try again.')
          } finally {
            setPending(false)
            busy.current = false
          }
        }}
      >
        <fieldset className={styles.fields} disabled={pending}>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {(
            [
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['street', 'Street and number'],
              ['city', 'City'],
              ['postalCode', 'Postal code'],
              ['country', 'Country'],
            ] as const
          ).map(([name, label]) => (
            <label key={name} htmlFor={`${id}-${name}`} className={styles.field}>
              {label}
              <input
                id={`${id}-${name}`}
                name={name}
                required
                maxLength={name === 'street' ? 250 : name === 'postalCode' ? 30 : 100}
                value={values[name]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [name]: event.target.value }))
                }
              />
            </label>
          ))}
          <button className={styles.button}>{pending ? 'Saving…' : 'Save payer address'}</button>
        </fieldset>
      </form>
    </section>
  )
}
