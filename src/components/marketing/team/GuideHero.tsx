import Image from 'next/image'
import Link from 'next/link'
import type { Guide } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './GuideHero.module.css'

export function GuideHero({ guide }: { guide: Guide }) {
  const photo = mediaUrl(guide.photo)
  const spaceIdx = guide.name.indexOf(' ')
  const first = spaceIdx === -1 ? guide.name : guide.name.slice(0, spaceIdx)
  const rest = spaceIdx === -1 ? null : guide.name.slice(spaceIdx + 1)
  const sub = guide.heroSub ?? guide.tagline

  return (
    <section className={styles.hero}>
      {photo ? (
        <Image
          src={photo}
          alt={mediaAlt(guide.photo)}
          fill
          priority
          sizes="100vw"
          className={styles.bg}
        />
      ) : null}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        {guide.role ? <p className={`section-label ${styles.eyebrow}`}>{guide.role}</p> : null}
        <h1 className={styles.name}>
          {first}
          {rest ? (
            <>
              <br />
              <em>{rest}</em>
            </>
          ) : null}
        </h1>
        {guide.tags?.length ? (
          <div className={styles.tagRow}>
            {guide.tags.map((t) => (
              <span key={t.id ?? t.text} className={styles.tag}>
                {t.text}
              </span>
            ))}
          </div>
        ) : null}
        {sub ? <p className={styles.sub}>{sub}</p> : null}
        <div className={styles.btnRow}>
          <Link href="#trips" className="btn-primary">
            Book a course with {first} →
          </Link>
          <Link href="/team" className="btn-ghost">
            Meet the full crew
          </Link>
        </div>
      </div>
      {guide.heroCaption ? <p className={styles.caption}>{guide.heroCaption}</p> : null}
    </section>
  )
}
