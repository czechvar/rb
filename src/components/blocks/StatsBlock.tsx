import type { Page } from '@/payload-types'
import styles from './blocks.module.css'

type StatsBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'stats' }
>

export function StatsBlock({ body, columns, eyebrow, heading, items, variant }: StatsBlockProps) {
  if (!items?.length) return null

  const className = [
    styles.statsSection,
    variant === 'dark' || variant === 'inlineDark' || variant === 'numberedDark'
      ? styles.statsDark
      : '',
    variant === 'inlineDark' ? styles.statsInlineDark : '',
    variant === 'numberedDark' ? styles.statsNumberedDark : '',
    columns === '2' ? styles.statsColumns2 : '',
    columns === '3' ? styles.statsColumns3 : '',
    columns === '4' ? styles.statsColumns4 : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        {heading || body || eyebrow ? (
          <div className={styles.sectionHeader}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {heading ? <h2>{heading}</h2> : null}
            {body ? <p className={styles.lead}>{body}</p> : null}
          </div>
        ) : null}
        <dl className={styles.statsGrid}>
          {items.map((item) => (
            <div key={item.id ?? `${item.value}-${item.label}`} className={styles.statItem}>
              <dt>{item.value}</dt>
              <dd>
                <strong>{item.label}</strong>
                {item.body ? <span>{item.body}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
