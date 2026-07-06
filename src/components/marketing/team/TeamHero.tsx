import Link from 'next/link'
import styles from './TeamHero.module.css'

export function TeamHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <span className={styles.eyebrow}>Elite Climbing Guides &amp; Coaching</span>
        <h1 className={styles.title}>
          Your rock.
          <br />
          Your limit.
          <br />
          <span className={styles.red}>Broken.</span>
        </h1>
        <p className={styles.sub}>
          World-class climbers, UIAGM-certified mountain guides, and professional coaches — one
          community built on genuine passion for the vertical world.
        </p>
        <div className={styles.btnGroup}>
          <Link href="/programs" className="btn-primary">
            Find Your Course →
          </Link>
          <Link href="/team#coaches" className="btn-ghost">
            Meet the Team
          </Link>
        </div>
      </div>
      <p className={styles.caption}>Jany · Espolón de las Ranas 7c+</p>
    </section>
  )
}
