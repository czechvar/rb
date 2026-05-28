'use client'
import React, { useActionState, useState } from 'react'
import { FormField } from '@/components/forms/FormField'
import { FormBanner } from '@/components/forms/FormBanner'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { INITIAL_ACTION_STATE, type ActionResult } from '@/components/forms/action-result'
import styles from './addresses.module.css'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

interface Props {
  initial?: Address
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  submitLabel: string
}

export function AddressForm({ initial, action, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE)
  const echoed = !state.ok ? state.values : undefined
  const initialCompanyName = echoed?.companyName ?? initial?.company?.companyName
  const [showCompany, setShowCompany] = useState(!!initialCompanyName)
  return (
    <>
      {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
      <form action={formAction}>
        <FormField
          name="label"
          label="Label (optional)"
          defaultValue={echoed?.label ?? initial?.label ?? ''}
          helpText="Home, Work, Mom's place…"
        />
        <FormField
          name="firstName"
          label="First name"
          required
          defaultValue={echoed?.firstName ?? initial?.firstName}
          error={!state.ok ? state.fieldErrors?.firstName : undefined}
        />
        <FormField
          name="lastName"
          label="Last name"
          required
          defaultValue={echoed?.lastName ?? initial?.lastName}
          error={!state.ok ? state.fieldErrors?.lastName : undefined}
        />
        <FormField
          name="street"
          label="Street"
          required
          defaultValue={echoed?.street ?? initial?.street}
          error={!state.ok ? state.fieldErrors?.street : undefined}
        />
        <FormField
          name="city"
          label="City"
          required
          defaultValue={echoed?.city ?? initial?.city}
          error={!state.ok ? state.fieldErrors?.city : undefined}
        />
        <FormField
          name="postalCode"
          label="Postal code"
          required
          defaultValue={echoed?.postalCode ?? initial?.postalCode}
          error={!state.ok ? state.fieldErrors?.postalCode : undefined}
        />
        <FormField
          name="country"
          label="Country"
          required
          defaultValue={echoed?.country ?? initial?.country ?? 'CZ'}
          error={!state.ok ? state.fieldErrors?.country : undefined}
        />
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showCompany}
            onChange={(e) => setShowCompany(e.currentTarget.checked)}
          />
          Use as a company invoice address
        </label>
        {showCompany && (
          <div className={styles.companyBox}>
            <FormField
              name="companyName"
              label="Company name"
              defaultValue={echoed?.companyName ?? initial?.company?.companyName ?? ''}
              error={!state.ok ? state.fieldErrors?.companyName : undefined}
            />
            <FormField
              name="ico"
              label="IČO"
              defaultValue={echoed?.ico ?? initial?.company?.ico ?? ''}
              error={!state.ok ? state.fieldErrors?.ico : undefined}
            />
            <FormField
              name="dic"
              label="DIČ (optional)"
              defaultValue={echoed?.dic ?? initial?.company?.dic ?? ''}
              error={!state.ok ? state.fieldErrors?.dic : undefined}
            />
          </div>
        )}
        {!showCompany && (
          <>
            <input type="hidden" name="companyName" value="" />
            <input type="hidden" name="ico" value="" />
            <input type="hidden" name="dic" value="" />
          </>
        )}
        <label className={styles.toggle}>
          <input type="checkbox" name="isDefault" defaultChecked={initial?.isDefault ?? false} />
          Set as default address
        </label>
        <SubmitButton>{submitLabel}</SubmitButton>
      </form>
    </>
  )
}
