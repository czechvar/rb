import React from 'react'
import styles from './contact.module.css'

export type ContactDetailsProps = {
  eyebrow?: string | null
  heading: string
  emailLabel?: string | null
  email: string
  emailNote?: string | null
  phoneLabel?: string | null
  desks?: { id?: string | null; label: string; phone: string; whatsapp?: boolean | null }[] | null
}

export function ContactDetails({ eyebrow, heading, emailLabel, email, emailNote, phoneLabel, desks }: ContactDetailsProps) {
  return (
    <section id="contact-details" className={styles.details}>
      <div className={styles.inner}>
        {eyebrow && <p className={styles.eyebrow} data-eyebrow="section">{eyebrow}</p>}
        <h2 className={styles.heading}>{heading}</h2>
        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.icon} aria-hidden="true">✉</span>
            <h3 className={styles.cardLabel}>{emailLabel || 'Email'}</h3>
            <a className={styles.contactLink} href={`mailto:${encodeURIComponent(email.trim())}`}>{email}</a>
            {emailNote && <p className={styles.note}>{emailNote}</p>}
          </div>
          <div className={styles.card}>
            <span className={styles.icon} aria-hidden="true">✆</span>
            <h3 className={styles.cardLabel}>{phoneLabel || 'Phone & WhatsApp'}</h3>
            {desks?.map((desk, index) => {
              const number = desk.phone.replace(/[^\d+]/g, '')
              const digits = desk.phone.replace(/\D/g, '')
              return <div className={styles.desk} key={desk.id || index}>
                <div className={styles.phoneRow}>
                  <a className={styles.contactLink} href={`tel:${number}`} aria-label={`Call ${desk.label}: ${desk.phone}`}>{desk.phone}</a>
                  {desk.whatsapp && <a className={styles.whatsapp} href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${desk.label} (opens in a new tab)`}>WhatsApp Us <span aria-hidden="true">↗</span></a>}
                </div>
                <p className={styles.note}>{desk.label}</p>
              </div>
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
