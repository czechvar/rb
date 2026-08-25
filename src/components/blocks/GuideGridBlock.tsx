import Link from 'next/link'
import type { Guide, Page } from '@/payload-types'
import { resolveGuideGridGuides } from '@/lib/block-resolvers/domain-grids'
import styles from './blocks.module.css'

type GuideGridBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'guideGrid' }
>

export async function GuideGridBlock({
  eyebrow,
  guides,
  heading,
  intro,
  limit,
  source,
  variant,
}: GuideGridBlockProps) {
  const items = await resolveGuideGridGuides({ source, guides, limit })
  if (!items.length) return null

  return (
    <section className={styles.domainGridSection}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  )
}

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link href={`/team/${guide.slug}`} className={styles.domainCard}>
      {guide.role ? <p className={styles.cardMeta}>{guide.role}</p> : null}
      <h3>{guide.name}</h3>
      {guide.tagline ? <p>{guide.tagline}</p> : null}
      <span className={styles.cardLinkText}>Meet guide</span>
    </Link>
  )
}

function BlockHeader({
  eyebrow,
  heading,
  intro,
}: {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
}) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <div className={styles.sectionHeader}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className={styles.lead}>{intro}</p> : null}
    </div>
  )
}

function gridClassName(variant?: string | null) {
  return [styles.domainGrid, variant === 'compact' ? styles.domainGridCompact : '']
    .filter(Boolean)
    .join(' ')
}
