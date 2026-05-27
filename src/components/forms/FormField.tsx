// src/components/forms/FormField.tsx
import React from 'react'
import styles from './forms.module.css'

interface Props {
  name: string
  label: string
  type?: string
  defaultValue?: string
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
  required,
  autoComplete,
  error,
  helpText,
}: Props) {
  const id = `field-${name}`
  const describedBy: string[] = []
  if (helpText) describedBy.push(`${id}-help`)
  if (error) describedBy.push(`${id}-error`)
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
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
