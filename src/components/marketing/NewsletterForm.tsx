'use client'

import type { FormEvent } from 'react'
import styles from './marketing.module.css'

export function NewsletterForm() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <form className={styles.footerNewsletter} onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Your email address"
        aria-label="Email address"
        required
      />
      <button type="submit">Subscribe</button>
    </form>
  )
}
