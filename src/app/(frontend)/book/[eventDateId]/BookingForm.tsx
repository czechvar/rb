'use client'
import React, { useActionState, useState, useTransition } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import styles from '@/components/forms/forms.module.css'
import { createBookingAction } from './actions'
import {
  validateDiscountCodeAction,
  type ValidateDiscountResult,
} from './validate-discount'

interface AddressOption {
  index: number
  label: string
  preview: string
  isDefault: boolean
}

interface Props {
  eventDateId: number
  unitPrice: number
  currency: string
  vat: number
  remaining: number
  addresses: AddressOption[]
  booker: { firstName: string; lastName: string; email: string; phone: string }
  referral: { name: string; discountPercent: number } | null
}

interface Participant {
  firstName: string; lastName: string; email: string; phone: string
}

type AppliedDiscount = Extract<ValidateDiscountResult, { ok: true }>

export function BookingForm({
  eventDateId, unitPrice, currency, vat, remaining, addresses, booker, referral,
}: Props) {
  const [state, formAction] = useActionState(createBookingAction, INITIAL_ACTION_STATE)
  const initial: Participant[] = [
    { firstName: booker.firstName, lastName: booker.lastName, email: booker.email, phone: booker.phone },
  ]
  const [participants, setParticipants] = useState<Participant[]>(initial)
  const [addressIndex, setAddressIndex] = useState(
    String(addresses.find((a) => a.isDefault)?.index ?? 0),
  )
  const [note, setNote] = useState('')

  // Discount-code panel state.
  const [showCodePanel, setShowCodePanel] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [applied, setApplied] = useState<AppliedDiscount | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const noAddresses = addresses.length === 0
  const overCapacity = participants.length > remaining

  const update = (i: number, patch: Partial<Participant>) => {
    setParticipants((curr) => curr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  const add = () =>
    setParticipants((curr) => [...curr, { firstName: '', lastName: '', email: '', phone: '' }])
  const remove = (i: number) => setParticipants((curr) => curr.filter((_, idx) => idx !== i))

  const subtotal = unitPrice * participants.length
  // Snowbusters stacking rule (client preview, server is authoritative).
  const effectivePercent = applied
    ? applied.discountPercent
    : referral
      ? referral.discountPercent
      : 0
  const discountAmount = Math.round((subtotal * effectivePercent) / 100)
  const total = subtotal - discountAmount

  const apply = () => {
    setCodeError(null)
    startTransition(async () => {
      const r = await validateDiscountCodeAction({ code: codeInput, eventDateId })
      if (r.ok) {
        setApplied(r)
        setCodeError(null)
      } else {
        setApplied(null)
        setCodeError(r.message)
      }
    })
  }

  const removeCode = () => {
    setApplied(null)
    setCodeInput('')
    setCodeError(null)
  }

  return (
    <>
      {state.ok && <FormBanner kind="success">Booking submitted — redirecting…</FormBanner>}
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      {noAddresses && (
        <FormBanner kind="error">
          You need at least one saved address before booking.{' '}
          <a href="/account/addresses">Add an address →</a>
        </FormBanner>
      )}
      {referral && (
        <div
          style={{
            background: '#eef7ee',
            border: '1px solid #b8d8b9',
            padding: 12,
            borderRadius: 6,
            margin: '12px 0',
          }}
        >
          You&apos;re booking via <strong>{referral.name}</strong>
          {referral.discountPercent > 0
            ? ` — ${referral.discountPercent}% off applied automatically.`
            : '.'}
        </div>
      )}
      <form action={formAction}>
        <input type="hidden" name="eventDateId" value={eventDateId} />
        {applied && <input type="hidden" name="discountCodeId" value={applied.id} />}

        <h2 style={{ marginTop: 24 }}>Participants</h2>
        {participants.map((p, i) => (
          <fieldset key={i} style={{ border: '1px solid #e3e0dc', padding: 16, marginBottom: 12, borderRadius: 6 }}>
            <legend style={{ padding: '0 8px' }}>
              Participant {i + 1}
              {i > 0 && (
                <button type="button" onClick={() => remove(i)} style={{ marginLeft: 12, background: 'none', border: 0, color: '#c8102e', cursor: 'pointer' }}>
                  Remove
                </button>
              )}
            </legend>
            <FormField name={`participants.${i}.firstName`} label="First name"
              value={p.firstName} onChange={(e) => update(i, { firstName: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.firstName`] : undefined} />
            <FormField name={`participants.${i}.lastName`} label="Last name"
              value={p.lastName} onChange={(e) => update(i, { lastName: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.lastName`] : undefined} />
            <FormField name={`participants.${i}.email`} label="Email" type="email"
              value={p.email} onChange={(e) => update(i, { email: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.email`] : undefined} />
            <FormField name={`participants.${i}.phone`} label="Phone"
              value={p.phone} onChange={(e) => update(i, { phone: e.target.value })}
              required error={!state.ok ? state.fieldErrors?.[`participants.${i}.phone`] : undefined} />
          </fieldset>
        ))}
        <button type="button" onClick={add} disabled={participants.length >= remaining} style={{ marginBottom: 24 }}>
          + Add participant
        </button>

        <h2>Billing address</h2>
        {noAddresses ? (
          <p>No saved addresses yet.</p>
        ) : (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="addressIndex">Pick from your saved addresses</label>
            <select id="addressIndex" name="addressIndex" className={styles.input}
              value={addressIndex} onChange={(e) => setAddressIndex(e.target.value)}>
              {addresses.map((a) => (
                <option key={a.index} value={a.index}>
                  {a.label}{a.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 8, fontSize: 14, color: '#444', whiteSpace: 'pre-line' }}>
              {addresses.find((a) => String(a.index) === addressIndex)?.preview}
            </div>
            {!state.ok && state.fieldErrors?.addressIndex && (
              <span role="alert" className={styles.error}>{state.fieldErrors.addressIndex}</span>
            )}
          </div>
        )}

        <h2>Have a discount code?</h2>
        {!applied && !showCodePanel && (
          <button
            type="button"
            onClick={() => setShowCodePanel(true)}
            style={{ background: 'none', border: 0, color: '#1a73e8', cursor: 'pointer', padding: 0 }}
          >
            + Add a code
          </button>
        )}
        {!applied && showCodePanel && (
          <div className={styles.field} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter code"
              className={styles.input}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={apply}
              disabled={pending || codeInput.trim().length === 0}
              style={{ padding: '8px 16px' }}
            >
              {pending ? 'Applying…' : 'Apply'}
            </button>
          </div>
        )}
        {codeError && <span role="alert" className={styles.error}>{codeError}</span>}
        {applied && (
          <div style={{ background: '#eef7ee', padding: 12, borderRadius: 6, marginTop: 8 }}>
            <strong>{applied.code}</strong> applied — {applied.discountPercent}% off
            <button
              type="button"
              onClick={removeCode}
              style={{ marginLeft: 12, background: 'none', border: 0, color: '#c8102e', cursor: 'pointer' }}
            >
              Remove
            </button>
            {applied.description && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>{applied.description}</p>
            )}
          </div>
        )}

        <h2>Notes (optional)</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="customerNote">Any extra info for our team</label>
          <textarea id="customerNote" name="customerNote" className={styles.input} rows={4}
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div style={{ background: '#f5f1ea', padding: 16, borderRadius: 6, margin: '16px 0' }}>
          <strong>Order summary</strong>
          <div style={{ marginTop: 8 }}>
            <div>
              Subtotal: {unitPrice} {currency} × {participants.length} = {subtotal} {currency}
            </div>
            {discountAmount > 0 && (
              <div style={{ color: '#206020' }}>
                Discount{applied ? ` (${applied.code})` : referral ? ` (${referral.name})` : ''}:
                {' '}−{discountAmount} {currency}
              </div>
            )}
            <div style={{ marginTop: 4 }}>
              <strong>Total: {total} {currency}</strong>
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>VAT {vat}% included.</div>
          </div>
        </div>
        {overCapacity && (
          <FormBanner kind="error">
            Only {remaining} seat(s) left. Reduce the participant count.
          </FormBanner>
        )}
        <SubmitButton>{noAddresses || overCapacity ? 'Cannot submit' : 'Submit booking'}</SubmitButton>
      </form>
    </>
  )
}
