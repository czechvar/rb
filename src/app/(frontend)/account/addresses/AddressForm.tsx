'use client'
import React, { useActionState, useState } from 'react'
import Link from 'next/link'
import { FormBanner } from '@/components/forms/FormBanner'
import { INITIAL_ACTION_STATE, type ActionResult } from '@/components/forms/action-result'
import checkout from '@/components/checkout/checkout.module.css'
import { AccountField, AccountSubmit } from '../form-controls'
import styles from '../account.module.css'
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
  const errors = !state.ok ? state.fieldErrors : undefined
  return (
    <div className={checkout.layout}>
      <div className={checkout.stack}>
        <section className={checkout.panel}>
          <h2 data-type="card-lg">Your details</h2>
          {!state.ok && state.formError && <FormBanner kind="error">{state.formError}</FormBanner>}
          <form action={formAction}>
            <div className={checkout.fields}>
              <AccountField
                name="label"
                label="Label (optional)"
                defaultValue={echoed?.label ?? initial?.label ?? ''}
                helpText="Home, Work, Mom's place…"
              />
              <div className={checkout.formRow}>
                <AccountField
                  name="firstName"
                  label="First name"
                  required
                  autoComplete="given-name"
                  defaultValue={echoed?.firstName ?? initial?.firstName}
                  error={errors?.firstName}
                />
                <AccountField
                  name="lastName"
                  label="Last name"
                  required
                  autoComplete="family-name"
                  defaultValue={echoed?.lastName ?? initial?.lastName}
                  error={errors?.lastName}
                />
              </div>
              <AccountField
                name="street"
                label="Street and number"
                required
                autoComplete="street-address"
                defaultValue={echoed?.street ?? initial?.street}
                error={errors?.street}
              />
              <div className={checkout.formRow}>
                <AccountField
                  name="postalCode"
                  label="Postal code"
                  required
                  defaultValue={echoed?.postalCode ?? initial?.postalCode}
                  error={errors?.postalCode}
                />
                <AccountField
                  name="city"
                  label="City"
                  required
                  defaultValue={echoed?.city ?? initial?.city}
                  error={errors?.city}
                />
              </div>
              <AccountField
                name="country"
                label="Country"
                required
                defaultValue={echoed?.country ?? initial?.country ?? 'CZ'}
                error={errors?.country}
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
                  <AccountField
                    name="companyName"
                    label="Company name"
                    defaultValue={echoed?.companyName ?? initial?.company?.companyName ?? ''}
                    error={errors?.companyName}
                  />
                  <div className={checkout.formRow}>
                    <AccountField
                      name="ico"
                      label="IČO"
                      defaultValue={echoed?.ico ?? initial?.company?.ico ?? ''}
                      error={errors?.ico}
                    />
                    <AccountField
                      name="dic"
                      label="DIČ (optional)"
                      defaultValue={echoed?.dic ?? initial?.company?.dic ?? ''}
                      error={errors?.dic}
                    />
                  </div>
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
              <AccountSubmit>{submitLabel}</AccountSubmit>
            </div>
          </form>
        </section>
        <Link className={`btn-ghost ${checkout.button}`} href="/account/addresses">
          All addresses
        </Link>
      </div>
    </div>
  )
}
