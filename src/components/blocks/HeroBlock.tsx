import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { BlockAction } from './BlockAction'
import styles from './blocks.module.css'

type HeroBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'hero' }>

export function HeroBlock({ backgroundMedia, body, eyebrow, heading, primaryAction, variant }: HeroBlockProps) {
  const imageUrl = mediaUrl(backgroundMedia)
  const className = [
    styles.hero,
    variant === 'simple' ? styles.heroSimple : '',
    variant === 'editorial' ? styles.heroEditorial : '',
    variant === 'brandEditorial' ? styles.heroBrandEditorial : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={className}>
      {imageUrl && variant !== 'simple' ? (
        <Image
          src={imageUrl}
          alt={mediaAlt(backgroundMedia)}
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
      ) : null}
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={styles.heroInner}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1>{formatBrandHeading(heading, variant)}</h1>
        {body ? <p className={styles.heroBody}>{body}</p> : null}
        <BlockAction
          href={primaryAction?.href}
          label={primaryAction?.label}
          className={styles.primaryButton}
        />
      </div>
    </section>
  )
}

function formatBrandHeading(heading: string, variant?: string | null) {
  if (variant !== 'brandEditorial') return heading
  const parts = heading.split(' ')
  const emphasizedIndex = parts.findIndex((part) => part.toLowerCase().includes('harder'))
  if (emphasizedIndex === -1) return heading

  return parts.map((part, index) => (
    <span
      key={`${part}-${index}`}
      className={index === emphasizedIndex ? styles.heroAccentWord : undefined}
    >
      {part}
      {index < parts.length - 1 ? ' ' : ''}
    </span>
  ))
}
