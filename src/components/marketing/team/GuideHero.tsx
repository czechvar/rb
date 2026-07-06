import Image from 'next/image'
import type { Guide } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './GuideHero.module.css'

export function GuideHero({ guide }: { guide: Guide }) {
  const photo = mediaUrl(guide.photo)
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.text}>
          {guide.role ? <p className={styles.eyebrow}>{guide.role}</p> : null}
          <h1 className={styles.name}>{guide.name}</h1>
          {guide.tags?.length ? (
            <div className={styles.tagRow}>
              {guide.tags.map((t) => (
                <span key={t.id ?? t.text} className={styles.tag}>
                  {t.text}
                </span>
              ))}
            </div>
          ) : null}
          {guide.tagline ? <p className={styles.tagline}>{guide.tagline}</p> : null}
        </div>
        {photo ? (
          <div className={styles.photoWrap}>
            <Image
              src={photo}
              alt={mediaAlt(guide.photo)}
              fill
              priority
              sizes="(max-width: 860px) 100vw, 45vw"
              className={styles.photo}
            />
            <div className={styles.fade} aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
