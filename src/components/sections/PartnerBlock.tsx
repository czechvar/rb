import Image from 'next/image'
import type { Event, Partner } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './PartnerBlock.module.css'

function resolvePartner(p: Event['partner']): Partner | null {
  if (!p || typeof p === 'number') return null
  return p
}

export function PartnerBlock({
  partner,
  eyebrow,
  headline,
  description,
  benefits,
}: {
  partner?: Event['partner']
  eyebrow?: Event['partnerEyebrow']
  headline?: Event['partnerHeadline']
  description?: Event['partnerDescription']
  benefits?: Event['partnerBenefits']
}) {
  const resolved = resolvePartner(partner)
  if (!resolved && !headline && !description && !benefits?.length) return null

  const logoUrl = resolved ? mediaUrl(resolved.logo) : undefined

  return (
    <section className={styles.section}>
      <h2>Try Before You Buy</h2>
      <div className={styles.panel}>
        <div className={styles.body}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          {headline && <h3>{headline}</h3>}
          {description && <p className={styles.desc}>{description}</p>}
          {benefits?.length ? (
            <ul className={styles.benefits}>
              {benefits.map((b, i) => (
                <li key={i}>
                  <span className={styles.check}>✓</span>
                  {b.text}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {resolved && (
          <div className={styles.logoBox}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={mediaAlt(resolved.logo) || resolved.name}
                width={180}
                height={120}
                className={styles.logo}
              />
            ) : (
              <div className={styles.logoPlaceholder}>{resolved.name}</div>
            )}
            <div className={styles.logoName}>{resolved.name}</div>
            <div className={styles.badge}>OFFICIAL PARTNER</div>
          </div>
        )}
      </div>
    </section>
  )
}
