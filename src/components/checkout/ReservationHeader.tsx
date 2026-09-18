'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import styles from './checkout.module.css'

export function ReservationHeader({
  reference,
  title,
  status,
  expiresAt,
  eyebrow = 'Your reservation',
  referenceLabel = 'Reservation reference',
}: {
  reference: string
  title: string
  status: string
  expiresAt?: string | null
  eyebrow?: string
  referenceLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const deadline = useMemo(() => {
    if (!hydrated || !expiresAt) return ''
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(expiresAt))
  }, [expiresAt, hydrated])

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <header className={styles.header}>
      <p className={styles.eyebrow} data-eyebrow="section">
        {eyebrow}
      </p>
      <h1 data-type="section">{title}</h1>
      <div className={styles.reservationMeta}>
        <span className={styles.statusBadge}>{status}</span>
        {expiresAt && (
          <span className={styles.deadline}>Held until {deadline || 'checking local time…'}</span>
        )}
      </div>
      <div className={styles.referenceRow}>
        <span className={styles.referenceLabel}>{referenceLabel}</span>
        <code>{reference}</code>
        <button type="button" className={styles.copyButton} onClick={copyReference}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span className={styles.srOnly} role="status" aria-live="polite">
          {copied ? `${referenceLabel} copied.` : ''}
        </span>
      </div>
    </header>
  )
}
