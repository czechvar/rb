import type { Page } from '@/payload-types'
import { resolveProgramGridPrograms } from '@/lib/block-resolvers/domain-grids'
import { BlockHeader, ProgramCard } from './CatalogueCards'
import styles from './blocks.module.css'

type ProgramGridBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'programGrid' }
>

export async function ProgramGridBlock({
  eyebrow,
  heading,
  intro,
  limit,
  programs,
  source,
  variant,
}: ProgramGridBlockProps) {
  const items = await resolveProgramGridPrograms({ source, programs, limit })
  if (!items.length) return null

  return (
    <section className={sectionClassName(variant)}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={gridClassName(variant)}>
          {items.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </section>
  )
}

function gridClassName(variant?: string | null) {
  return [
    styles.domainGrid,
    variant === 'compact' || variant === 'darkCompact' ? styles.domainGridCompact : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function sectionClassName(variant?: string | null) {
  return [
    styles.domainGridSection,
    variant === 'darkCompact' ? styles.domainGridDarkCompact : '',
  ].filter(Boolean).join(' ')
}
