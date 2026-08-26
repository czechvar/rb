import Link from 'next/link'
import type { Page, Program } from '@/payload-types'
import { resolveProgramGridPrograms } from '@/lib/block-resolvers/domain-grids'
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

function ProgramCard({ program }: { program: Program }) {
  return (
    <Link href={`/programs/${program.slug}`} className={styles.domainCard}>
      <p className={styles.cardMeta}>Program</p>
      <h3>{program.name}</h3>
      {program.shortDescription ? <p>{program.shortDescription}</p> : null}
      <span className={styles.cardLinkText}>Explore program</span>
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
