import type { Page, Partner } from '@/payload-types'
import { resolvePartnerStripPartners } from '@/lib/block-resolvers/content-discovery'
import styles from './blocks.module.css'

type PartnerStripBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'partnerStrip' }
>

export async function PartnerStripBlock({
  eyebrow,
  heading,
  intro,
  source,
  partners,
  limit,
  variant,
}: PartnerStripBlockProps) {
  const items = await resolvePartnerStripPartners({ source, partners, limit })
  if (!items.length) return null

  return (
    <section className={styles.partnerStripSection}>
      <div className={styles.sectionInner}>
        <BlockHeader eyebrow={eyebrow} heading={heading} intro={intro} />
        <div className={variant === 'cards' ? styles.partnerCards : styles.partnerStrip}>
          {items.map((partner) => (
            <PartnerItem key={partner.id} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PartnerItem({ partner }: { partner: Partner }) {
  const content = (
    <>
      <span>{partner.name}</span>
      {partner.featured ? <small>Featured partner</small> : null}
    </>
  )

  if (partner.link) {
    return (
      <a href={partner.link} className={styles.partnerItem}>
        {content}
      </a>
    )
  }

  return <div className={styles.partnerItem}>{content}</div>
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
