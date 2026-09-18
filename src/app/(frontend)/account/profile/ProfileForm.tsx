'use client'
import React, { useActionState, useState } from 'react'
import { FormBanner } from '@/components/forms/FormBanner'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountField, AccountSubmit } from '../form-controls'
import styles from '../account.module.css'
import { updateProfileAction, cancelPendingEmailChangeAction } from './actions'

interface Props {
  initial: { name: string; phone: string; email: string }
  pendingEmail?: string
}

export function ProfileForm({ initial, pendingEmail }: Props) {
  const [state, formAction] = useActionState(updateProfileAction, INITIAL_ACTION_STATE)
  const echoed = !state.ok ? state.values : undefined
  const [email, setEmail] = useState(echoed?.email ?? initial.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const emailDirty = email !== initial.email
  const fieldErrors = !state.ok ? state.fieldErrors : undefined
  return (
    <div className={checkout.layout}>
      <div className={checkout.stack}>
        {pendingEmail && (
          <div className={checkout.notice} role="status">
            <p className={styles.noticeBody}>
              We sent a confirmation link to <strong>{pendingEmail}</strong>. Until you click it,
              your sign-in email stays as <strong>{initial.email}</strong>.
            </p>
            <form action={cancelPendingEmailChangeAction} className={checkout.actions}>
              <button type="submit" className={`btn-ghost ${checkout.button}`}>
                Cancel pending email change
              </button>
            </form>
          </div>
        )}
        <section className={checkout.panel}>
          <h2 data-type="card-lg">Contact details</h2>
          <p className={checkout.muted}>We use these to reach you about your trips.</p>
          {state.ok && <FormBanner kind="success">Details saved.</FormBanner>}
          {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
          <form action={formAction}>
            <div className={checkout.fields}>
              <div className={checkout.formRow}>
                <AccountField
                  name="name"
                  label="Name"
                  defaultValue={echoed?.name ?? initial.name}
                  required
                  autoComplete="name"
                  error={fieldErrors?.name}
                />
                <AccountField
                  name="phone"
                  label="Phone"
                  type="tel"
                  defaultValue={echoed?.phone ?? initial.phone}
                  required
                  autoComplete="tel"
                  error={fieldErrors?.phone}
                />
              </div>
              <AccountField
                name="email"
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors?.email}
              />
              {emailDirty && (
                <AccountField
                  name="currentPassword"
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  helpText="Required to change your sign-in email."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  error={fieldErrors?.currentPassword}
                />
              )}
              <AccountSubmit>Save details</AccountSubmit>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
