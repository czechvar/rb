import Link from 'next/link'
import Image from 'next/image'
import type { Guide } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './GuidesGrid.module.css'

type GuidesGridProps = {
  guides: Guide[]
  heading: string
  label?: string
  compact?: boolean // Friends & Ambassadors variant
}

export function GuidesGrid({ guides, heading, label, compact = false }: GuidesGridProps) {
  if (guides.length === 0) return null
  return (
    <section className={styles.section} id={compact ? undefined : 'guides'}>
      <div className={styles.inner}>
        {label ? <p className="section-label">{label}</p> : null}
        <h2 className="section-title">{heading}</h2>
        <div className={`${styles.grid} ${compact ? styles.gridCompact : ''}`}>
          {guides.map((g) => {
            const url = mediaUrl(g.photo)
            return (
              <Link key={g.id} href={`/team/${g.slug}`} className={`${styles.card} reveal`}>
                <div className={styles.photoWrap}>
                  {url ? (
                    <Image
                      src={url}
                      alt={mediaAlt(g.photo)}
                      fill
                      sizes={
                        compact
                          ? '(max-width: 560px) 100vw, (max-width: 900px) 50vw, 25vw'
                          : '(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw'
                      }
                      className={styles.photo}
                    />
                  ) : (
                    <span className={styles.photoPlaceholder} aria-hidden="true" />
                  )}
                  <div className={styles.gradient} aria-hidden="true" />
                  <div className={styles.overlay}>
                    {g.role ? <p className={styles.role}>{g.role}</p> : null}
                    <h3 className={styles.name}>{g.name}</h3>
                  </div>
                </div>
                {!compact && (g.tags?.length || g.tagline) ? (
                  <div className={styles.meta}>
                    {g.tags?.length ? (
                      <div className={styles.tagRow}>
                        {g.tags.map((t) => (
                          <span key={t.id ?? t.text} className={styles.tag}>
                            {t.text}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {g.tagline ? <p className={styles.tagline}>{g.tagline}</p> : null}
                  </div>
                ) : null}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
