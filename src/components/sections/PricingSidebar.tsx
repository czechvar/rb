import Link from 'next/link'
import styles from './PricingSidebar.module.css'

export type PricingSidebarProps = {
  primaryPrice: string
  secondaryPrice?: string
  caption: string
  rows: Array<{ label: string; value: string }>
  callout?: string
  ctaHref: string
  ctaLabel: string
}

export function PricingSidebar({
  primaryPrice,
  secondaryPrice,
  caption,
  rows,
  callout,
  ctaHref,
  ctaLabel,
}: PricingSidebarProps) {
  return (
    <aside className={styles.card} aria-label="Trip pricing">
      <div className={styles.priceBlock}>
        <p className={styles.primaryPrice}>{primaryPrice}</p>
        {secondaryPrice && <p className={styles.secondaryPrice}>{secondaryPrice}</p>}
        <p className={styles.caption}>{caption}</p>
      </div>
      <hr className={styles.divider} aria-hidden="true" />
      <dl className={styles.rows}>
        {rows.map((r, i) => (
          <div key={i} className={styles.row}>
            <dt className={styles.rowLabel}>{r.label}</dt>
            <dd className={styles.rowValue}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {callout && <p className={styles.callout}>{callout}</p>}
      <Link href={ctaHref} className={styles.cta}>
        {ctaLabel}
      </Link>
    </aside>
  )
}
