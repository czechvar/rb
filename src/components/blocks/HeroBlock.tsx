import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { BlockAction } from './BlockAction'
import styles from './blocks.module.css'

type HeroBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'hero' }>

export function HeroBlock({
  accentWords,
  backgroundMedia,
  body,
  eyebrow,
  heading,
  primaryAction,
  variant,
}: HeroBlockProps) {
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
        <h1>{formatBrandHeading(heading, variant, accentWords)}</h1>
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

function formatBrandHeading(
  heading: string,
  variant?: string | null,
  accentWords?: DestinationHeroAccentWord[] | null,
) {
  if (variant !== 'brandEditorial') return heading
  const accentPhrases = normalizeAccentPhrases(accentWords)
  if (!accentPhrases.length) return heading

  const parts = splitByAccentPhrases(heading, accentPhrases)
  return parts.map((part, index) =>
    part.accent ? (
      <span key={`${part.text}-${index}`} className={styles.heroAccentWord}>
        {part.text}
      </span>
    ) : (
      part.text
    ),
  )
}

type DestinationHeroAccentWord = NonNullable<HeroBlockProps['accentWords']>[number]

function normalizeAccentPhrases(accentWords?: DestinationHeroAccentWord[] | null) {
  const configured = (accentWords ?? [])
    .map((item) => item.text?.trim())
    .filter((value): value is string => Boolean(value))

  return (configured.length ? configured : ['harder'])
    .sort((a, b) => b.length - a.length)
}

function splitByAccentPhrases(heading: string, accentPhrases: string[]) {
  const parts: Array<{ text: string; accent: boolean }> = []
  let remaining = heading

  while (remaining.length) {
    const nextMatch = findNextAccentMatch(remaining, accentPhrases)
    if (!nextMatch) {
      parts.push({ text: remaining, accent: false })
      break
    }

    if (nextMatch.index > 0) {
      parts.push({ text: remaining.slice(0, nextMatch.index), accent: false })
    }
    parts.push({
      text: remaining.slice(nextMatch.index, nextMatch.index + nextMatch.length),
      accent: true,
    })
    remaining = remaining.slice(nextMatch.index + nextMatch.length)
  }

  return parts
}

function findNextAccentMatch(heading: string, accentPhrases: string[]) {
  const lowerHeading = heading.toLowerCase()
  let bestMatch: { index: number; length: number } | null = null

  for (const phrase of accentPhrases) {
    const index = lowerHeading.indexOf(phrase.toLowerCase())
    if (index === -1) continue
    if (
      bestMatch === null ||
      index < bestMatch.index ||
      (index === bestMatch.index && phrase.length > bestMatch.length)
    ) {
      bestMatch = { index, length: phrase.length }
    }
  }

  return bestMatch
}
