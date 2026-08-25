import type { Page } from '@/payload-types'
import { BlockAction } from './BlockAction'
import styles from './blocks.module.css'

type CTABlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'cta' }>

export function CTABlock({
  body,
  eyebrow,
  heading,
  primaryAction,
  secondaryAction,
  variant,
}: CTABlockProps) {
  const className = [
    styles.cta,
    variant === 'light' ? styles.ctaLight : '',
    variant === 'red' ? styles.ctaRed : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        <div>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2>{heading}</h2>
          {body ? <p className={styles.lead}>{body}</p> : null}
        </div>
        <div className={styles.actionRow}>
          <BlockAction
            href={primaryAction?.href}
            label={primaryAction?.label}
            className={styles.primaryButton}
          />
          <BlockAction
            href={secondaryAction?.href}
            label={secondaryAction?.label}
            className={styles.secondaryButton}
          />
        </div>
      </div>
    </section>
  )
}
