'use client'

import { useRef, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { checkoutOperationAction } from './actions'
import { INITIAL_ACTION_STATE, type ActionResult } from '@/components/forms/action-result'
import styles from '@/components/checkout/checkout.module.css'
import operations from './operations.module.css'

export function OperationForm({
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
  const [result, setResult] = useState<ActionResult>(INITIAL_ACTION_STATE)
  const [pending, startTransition] = useTransition()
  const submitting = useRef(false)
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (submitting.current) return
        submitting.current = true
        const data = new FormData(event.currentTarget)
        startTransition(async () => {
          try {
            setResult(await checkoutOperationAction(INITIAL_ACTION_STATE, data))
          } catch {
            setResult({
              ok: false,
              formError:
                'The operation could not be completed. Check current receipts before retrying.',
            })
          } finally {
            submitting.current = false
          }
        })
      }}
      className={`${styles.stack} ${operations.form}`}
    >
      <input type="hidden" name="checkoutId" value={checkoutId} />
      <input type="hidden" name="operation" value={operation} />
      {uuid && <input type="hidden" name="uuid" value={uuid} />}
      <fieldset className={styles.fields} disabled={pending}>
        {children}
        <label>
          <input type="checkbox" name="confirmed" value="yes" required />{' '}
          {operation === 'refund'
            ? 'I confirm this refund was already issued by the provider. This only records its receipt.'
            : operation === 'cancel'
              ? 'I confirm cancellation releases these places. Any provider refund must be handled separately.'
              : 'Check the provider status and apply its confirmed result.'}
        </label>
        <button className={styles.button} disabled={pending}>
          {pending ? 'Processing…' : label}
        </button>
      </fieldset>
      {result.ok ? (
        <p role="status">Operation completed. Current receipts are shown below.</p>
      ) : result.formError ? (
        <p role="alert">{result.formError}</p>
      ) : null}
    </form>
  )
}
