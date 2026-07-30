// src/components/forms/FormField.tsx
import React from 'react'
import styles from './forms.module.css'

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
}: Props) {
  const id = `field-${name}`
  const describedBy: string[] = []
  if (helpText) describedBy.push(`${id}-help`)
  if (error) describedBy.push(`${id}-error`)
  const isControlled = value !== undefined && onChange !== undefined
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
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
        className={styles.input}
      />
      {helpText && <span id={`${id}-help`} style={{ fontSize: 13, color: '#666' }}>{helpText}</span>}
      {error && <span id={`${id}-error`} role="alert" className={styles.error}>{error}</span>}
    </div>
  )
}
