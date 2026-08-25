import Link from 'next/link'
import type { Guide, Page } from '@/payload-types'
import type { BlockRenderContext } from './RenderBlocks'
import { resolveGuideProfileGuide } from '@/lib/block-resolvers/content-discovery'
import styles from './blocks.module.css'

type GuideProfileBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'guideProfile' }
>

export async function GuideProfileBlock(
  { eyebrow, heading, intro, source, guide, variant }: GuideProfileBlockProps,
  context: BlockRenderContext = {},
) {
  const item = await resolveGuideProfileGuide({ source, guide, currentGuide: context.guide })
  if (!item) return null

  return (
    <section className={styles.domainGridSection}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <GuideProfileCard guide={item} compact={variant === 'compact'} />
      </div>
    </section>
  )
}

function GuideProfileCard({ guide, compact }: { guide: Guide; compact: boolean }) {
  return (
    <Link
      href={`/team/${guide.slug}`}
      className={`${styles.guideProfileCard} ${compact ? styles.guideProfileCompact : ''}`}
    >
      <p className={styles.cardMeta}>{guide.role ?? 'Guide'}</p>
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
