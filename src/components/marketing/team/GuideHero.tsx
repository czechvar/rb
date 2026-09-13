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
      <div className={styles.inner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/team">The crew</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{guide.name}</span>
        </nav>
        <div className={photo ? styles.grid : styles.textOnly}>
          <div className={styles.content}>
            <p data-eyebrow="hero" className={`section-label ${styles.eyebrow}`}>{guide.role || 'The Rockbusters crew'}</p>
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
                Explore trips with {first} →
              </Link>
              <Link href="/team" className="btn-ghost">
                Meet the full crew
              </Link>
            </div>
          </div>
          {photo ? (
            <figure className={styles.portrait}>
              <div className={styles.photo}>
                <Image src={photo} alt={mediaAlt(guide.photo) || guide.name} fill priority sizes="(max-width: 900px) 90vw, 40vw" />
              </div>
              {guide.heroCaption ? <figcaption className={styles.caption}>{guide.heroCaption}</figcaption> : null}
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  )
}
