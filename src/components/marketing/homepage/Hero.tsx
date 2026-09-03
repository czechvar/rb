import Link from 'next/link'
import Image from 'next/image'
import type { Media } from '@/payload-types'
import styles from './Hero.module.css'

type HeroProps = { backgroundMedia: Media | null }

export function Hero({ backgroundMedia }: HeroProps) {
  return (
    <section className={styles.hero}>
      {backgroundMedia?.url && (
        <Image
          src={backgroundMedia.url}
          alt={backgroundMedia.alt ?? ''}
          fill
          priority
          className={styles.bg}
          sizes="100vw"
        />
      )}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Climbers for climbers — Europe&apos;s finest crags</p>
        <h1 className={`section-title ${styles.h1}`}>
          CLIMB
          <br />
          <em className={styles.em}>HARDER.</em>
          <br />
          CLIMB
          <br />
          SMARTER.
        </h1>
        <p className={styles.sub}>
          We&apos;re not a travel company. We&apos;re a community of rock climbing guides,
          coaches, and passionate climbers. Climb harder. Climb smarter — with people obsessed
          with getting you stronger, sharper, and further than you thought possible.
        </p>
        <div className={styles.ctas}>
          <Link href="/programs" className="btn-primary">
            Find Your Trip
          </Link>
        </div>
        <div className={styles.trustStrip}>
          <span>
            ★ <strong>Trusted</strong> by climbers in 40+ countries
          </span>
          <span className={styles.trustDot}>·</span>
          <span>Elite coaches. Real progression. Zero fluff.</span>
          <span className={styles.trustDot}>·</span>
          <span>Adam Ondra · Daila Ojeda · Hazel Findlay · Dave Graham</span>
        </div>
      </div>
    </section>
  )
}
