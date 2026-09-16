'use client'

import { useActionState, useRef, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { INITIAL_ACTION_STATE, type ActionResult } from '@/components/forms/action-result'
import { adminCheckoutOperationAction, adminCheckoutReviewAction } from './actions'
import styles from './checkout-admin.module.css'

export function CheckoutAdminReviewForm({ id, approved }: { id: number; approved: boolean }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (previous: ActionResult, data: FormData) => {
      const result = await adminCheckoutReviewAction(previous, data)
      if (result.ok) router.refresh()
      return result
    },
    INITIAL_ACTION_STATE,
  )

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="checkout" value={id} />
      <label>
        Staff note
        <textarea name="note" maxLength={2000} disabled={pending} />
      </label>
      <div className={styles.actions}>
        <button type="submit" name="decision" value="approve" disabled={pending}>
          {pending ? 'Saving…' : approved ? 'Resend invitation' : 'Approve and invite'}
        </button>
        <button
          type="submit"
          name="decision"
          value="decline"
          className={styles.danger}
          disabled={pending}
        >
          Decline and release seats
        </button>
      </div>
      <ActionMessage result={state} />
    </form>
  )
}

export function CheckoutAdminApproveButton({ id }: { id: number }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (previous: ActionResult, data: FormData) => {
      const result = await adminCheckoutReviewAction(previous, data)
      if (result.ok) router.refresh()
      return result
    },
    INITIAL_ACTION_STATE,
  )

  return (
    <form action={action} className={`${styles.form} ${styles.quickAction}`}>
      <input type="hidden" name="checkout" value={id} />
      <input type="hidden" name="decision" value="approve" />
      <button type="submit" disabled={pending}>
        {pending ? 'Approving…' : 'Approve and invite'}
      </button>
      <ActionMessage result={state} />
    </form>
  )
}

export function CheckoutAdminOperationForm({
  checkoutId,
  operation,
  uuid,
  children,
  label,
}: {
  checkoutId: number
  operation: 'cancel' | 'expiry' | 'reconcile' | 'refund'
  uuid?: string
  children?: ReactNode
  label: string
}) {
  const router = useRouter()
  const [result, setResult] = useState<ActionResult>(INITIAL_ACTION_STATE)
  const [pending, startTransition] = useTransition()
  const submitting = useRef(false)

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (submitting.current) return
        submitting.current = true
        const data = new FormData(event.currentTarget)
        startTransition(async () => {
          try {
            const next = await adminCheckoutOperationAction(INITIAL_ACTION_STATE, data)
            setResult(next)
            if (next.ok) router.refresh()
          } catch {
            setResult({
              ok: false,
              formError:
                'The operation could not be completed. Refresh the checkout before retrying.',
            })
          } finally {
            submitting.current = false
          }
        })
      }}
    >
      <input type="hidden" name="checkoutId" value={checkoutId} />
      <input type="hidden" name="operation" value={operation} />
      {uuid && <input type="hidden" name="uuid" value={uuid} />}
      <fieldset disabled={pending}>
        {children}
        <label className={styles.confirmation}>
          <input type="checkbox" name="confirmed" value="yes" required />
          <span>
            {operation === 'refund'
              ? 'I confirm this refund was already issued by the provider. This only records its receipt.'
              : operation === 'cancel'
                ? 'I confirm cancellation releases these places. Provider refunds are handled separately.'
                : 'Check the provider status and apply its confirmed result.'}
          </span>
        </label>
        <button type="submit">{pending ? 'Processing…' : label}</button>
      </fieldset>
      <ActionMessage result={result} />
    </form>
  )
}

function ActionMessage({ result }: { result: ActionResult }) {
  if (result.ok)
    return (
      <p className={styles.success} role="status">
        Operation completed.
      </p>
    )
  if (result.formError)
    return (
      <p className={styles.error} role="alert">
        {result.formError}
      </p>
    )
  return null
}
