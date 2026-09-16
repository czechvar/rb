import Link from 'next/link'
import styles from './marketing.module.css'

export type Crumb = { href?: string; label: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (!items?.length) return null
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i}>
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
          {i < items.length - 1 ? <span className={styles.breadcrumbSep}>/</span> : null}
        </span>
      ))}
    </nav>
  )
}
