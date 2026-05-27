'use client'
import React, { useActionState, useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE } from '@/components/forms/action-result'
import styles from '@/components/forms/forms.module.css'
import { updateProfileAction } from './actions'

interface Props {
  initial: { name: string; phone: string; email: string }
  pendingEmail?: string
}

export function ProfileForm({ initial, pendingEmail }: Props) {
  const [state, formAction] = useActionState(updateProfileAction, INITIAL_ACTION_STATE)
  const [email, setEmail] = useState(initial.email)
  const emailDirty = email !== initial.email
  return (
    <>
      {state.ok && <FormBanner kind="success">Profile updated.</FormBanner>}
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      {pendingEmail && (
        <FormBanner kind="success">
          We sent a confirmation link to <strong>{pendingEmail}</strong>. Until you click it, your
          sign-in email stays as <strong>{initial.email}</strong>.
        </FormBanner>
      )}
      <form action={formAction}>
        <FormField
          name="name"
          label="Name"
          defaultValue={initial.name}
          required
          error={!state.ok ? state.fieldErrors?.name : undefined}
        />
        <FormField
          name="phone"
          label="Phone"
          defaultValue={initial.phone}
          required
          error={!state.ok ? state.fieldErrors?.phone : undefined}
        />
        <div className={styles.field}>
          <label className={styles.label} htmlFor="field-email">
            Email
          </label>
          <input
            id="field-email"
            name="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            autoComplete="email"
            required
            aria-invalid={!state.ok && state.fieldErrors?.email ? 'true' : undefined}
            aria-describedby={
              !state.ok && state.fieldErrors?.email ? 'field-email-error' : undefined
            }
          />
          {!state.ok && state.fieldErrors?.email && (
            <span id="field-email-error" role="alert" className={styles.error}>
              {state.fieldErrors.email}
            </span>
          )}
        </div>
        {emailDirty && (
          <FormField
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            helpText="Required to change your sign-in email."
            error={!state.ok ? state.fieldErrors?.currentPassword : undefined}
          />
        )}
        <SubmitButton>Save changes</SubmitButton>
      </form>
    </>
  )
}
