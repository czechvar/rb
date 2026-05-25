import type { Type } from '@/payload-types'
import styles from './Hero.module.css'

export function Hero({ type }: { type: Type }) {
  return (
    <section className={styles.hero}>
      <div className={styles.text}>
        <h1>{type.name}</h1>
        {type.shortDescription && <p className={styles.subline}>{type.shortDescription}</p>}
      </div>
      <aside className={styles.booking}>
        <div className={styles.price}>See dates below</div>
        <a href="#dates" className={styles.cta}>BOOK YOUR SPOT →</a>
      </aside>
    </section>
  )
}
