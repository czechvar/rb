// src/components/forms/SubmitButton.tsx
'use client'
import React from 'react'
import { useFormStatus } from 'react-dom'
import styles from './forms.module.css'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? 'Working…' : children}
    </button>
  )
}
