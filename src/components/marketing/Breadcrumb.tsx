import Link from 'next/link'
import styles from './marketing.module.css'

export type Crumb = { href?: string; label: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className={styles.breadcrumb}>
      {items.map((c, i) => (
        <span key={i}>
          {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
          {i < items.length - 1 ? ' / ' : ''}
        </span>
      ))}
    </div>
  )
}
