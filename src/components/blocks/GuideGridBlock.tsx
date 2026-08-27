import type { Page } from '@/payload-types'
import { resolveGuideGridGuides } from '@/lib/block-resolvers/domain-grids'
import { BlockHeader, GuideCard } from './CatalogueCards'
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
    <section className={sectionClassName(variant)}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((guide) => (
            <GuideCard key={guide.id} guide={guide} variant={variant} />
          ))}
        </div>
      </div>
    </section>
  )
}

function gridClassName(variant?: string | null) {
  return [
    styles.domainGrid,
    variant === 'compact' ? styles.domainGridCompact : '',
    variant === 'photoOverlay' ? styles.guidePhotoGrid : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function sectionClassName(variant?: string | null) {
  return [
    styles.domainGridSection,
    variant === 'photoOverlay' ? styles.guidePhotoSection : '',
  ].filter(Boolean).join(' ')
}
