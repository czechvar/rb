// src/components/forms/FormField.tsx
import React from 'react'
import styles from './forms.module.css'

// Replaces the default class set wholesale, so a caller can adopt another surface's field styling.
export interface FormFieldClassNames {
  field?: string
  label?: string
  input?: string
  help?: string
  error?: string
}

const DEFAULT_CLASS_NAMES: FormFieldClassNames = {
  field: styles.field,
  label: styles.label,
  input: styles.input,
  error: styles.error,
}

interface Props {
  name: string
  label: string
  type?: string
  // Uncontrolled mode — initial value, never re-applied across renders.
  defaultValue?: string
  // Controlled mode — pass value + onChange together. Takes precedence over
  // defaultValue. Required when the form needs to retain values across action
  // submissions (since React 19's form action resets uncontrolled inputs).
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  autoComplete?: string
  error?: string
  helpText?: string
  classNames?: FormFieldClassNames
}

export function FormField({
  name,
  label,
  type = 'text',
  defaultValue,
  value,
  onChange,
  required,
  autoComplete,
  error,
  helpText,
  classNames,
}: Props) {
  const id = `field-${name}`
  const describedBy: string[] = []
  if (helpText) describedBy.push(`${id}-help`)
  if (error) describedBy.push(`${id}-error`)
  const isControlled = value !== undefined && onChange !== undefined
  const cx = classNames ?? DEFAULT_CLASS_NAMES
  return (
    <div className={cx.field}>
      <label className={cx.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        {...(isControlled
          ? { value, onChange }
          : { defaultValue })}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={describedBy.length ? describedBy.join(' ') : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={cx.input}
      />
      {helpText && (
        <span
          id={`${id}-help`}
          className={cx.help}
          style={classNames ? undefined : { fontSize: 13, color: '#666' }}
        >
          {helpText}
        </span>
      )}
      {error && <span id={`${id}-error`} role="alert" className={cx.error}>{error}</span>}
    </div>
  )
}
