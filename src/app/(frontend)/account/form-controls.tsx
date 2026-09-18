import React from 'react'
import { FormField } from '@/components/forms/FormField'
import { SubmitButton } from '@/components/forms/SubmitButton'
import checkout from '@/components/checkout/checkout.module.css'

// The checkout stylesheet styles `.field input` itself, so the input and label need no class.
const FIELD_CLASS_NAMES = { field: checkout.field, help: checkout.helper, error: checkout.error }

export function AccountField(props: Omit<React.ComponentProps<typeof FormField>, 'classNames'>) {
  return <FormField {...props} classNames={FIELD_CLASS_NAMES} />
}

export function AccountSubmit({ children }: { children: React.ReactNode }) {
  return <SubmitButton className={`btn-primary ${checkout.button}`}>{children}</SubmitButton>
}
