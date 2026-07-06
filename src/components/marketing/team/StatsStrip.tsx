import Link from 'next/link'
import Image from 'next/image'
import type { Media } from '@/payload-types'
import styles from './StatsStrip.module.css'

type StatsStripProps = { backgroundMedia?: Media | null }

export function StatsStrip({ backgroundMedia }: StatsStripProps) {
  return (
    <section className={styles.band}>
      {backgroundMedia?.url && (
        <Image
          src={backgroundMedia.url}
          alt={backgroundMedia.alt ?? ''}
          fill
          sizes="100vw"
          className={styles.bg}
        />
      )}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <h2 className={`section-title ${styles.heading}`}>THE ROCK DOESN&apos;T LIE</h2>
        <p className={styles.body}>
          18 elite guides and coaches. 40+ destinations. One community built on genuine passion
          for the vertical world.
        </p>
        <Link href="#guides" className="btn-primary">
          View All Coaches &amp; Guides →
        </Link>
      </div>
    </section>
  )
}
