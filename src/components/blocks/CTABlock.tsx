import type { Page } from '@/payload-types'
import { BlockAction } from './BlockAction'
import styles from './blocks.module.css'

type CTABlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'cta' }>
type CTABlockAnalyticsContext = {
  pageSlug?: string | null
  blockIndex?: number
}

export function CTABlock({
  body,
  eyebrow,
  heading,
  id,
  primaryAction,
  secondaryAction,
  variant,
  analyticsContext,
}: CTABlockProps & { analyticsContext?: CTABlockAnalyticsContext }) {
  const className = [
    styles.cta,
    variant === 'light' ? styles.ctaLight : '',
    variant === 'red' || variant === 'finalRed' ? styles.ctaRed : '',
    variant === 'finalRed' ? styles.ctaFinalRed : '',
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
            analytics={primaryAction?.analytics}
            analyticsDefaults={{
              actionSlot: 'primary',
              blockId: id,
              blockIndex: analyticsContext?.blockIndex,
              blockType: 'cta',
              location: 'body_cta',
              pageSlug: analyticsContext?.pageSlug,
            }}
            className={styles.primaryButton}
          />
          <BlockAction
            href={secondaryAction?.href}
            label={secondaryAction?.label}
            analytics={secondaryAction?.analytics}
            analyticsDefaults={{
              actionSlot: 'secondary',
              blockId: id,
              blockIndex: analyticsContext?.blockIndex,
              blockType: 'cta',
              location: 'body_cta',
              pageSlug: analyticsContext?.pageSlug,
            }}
            className={styles.secondaryButton}
          />
        </div>
      </div>
    </section>
  )
}
