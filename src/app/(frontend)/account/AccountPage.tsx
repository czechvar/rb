import React from 'react'
import checkout from '@/components/checkout/checkout.module.css'

/** The reservation page's header and inset, shared by every account tab so they line up. */
export function AccountPage({
  title,
  eyebrow = 'My account',
  lead,
  actions,
  children,
}: {
  title: string
  eyebrow?: string
  lead?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={checkout.account}>
      <header className={checkout.header}>
        <p className={checkout.eyebrow} data-eyebrow="section">
          {eyebrow}
        </p>
        {/* Section size: the hero-size h1 is for landing pages and overwhelms an account tab. */}
        <h1 data-type="section">{title}</h1>
        {lead && <p className={checkout.lead}>{lead}</p>}
        {actions && <div className={checkout.actions}>{actions}</div>}
      </header>
      {children}
    </div>
  )
}
