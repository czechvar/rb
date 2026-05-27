// src/components/forms/FormBanner.tsx
import React from 'react'
import styles from './forms.module.css'

export function FormBanner({
  kind,
  children,
}: {
  kind: 'error' | 'success'
  children: React.ReactNode
}) {
  return (
    <div
      className={`${styles.banner} ${kind === 'error' ? styles.bannerError : styles.bannerSuccess}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
