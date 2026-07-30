import type { Program } from '@/payload-types'
import styles from './Hero.module.css'

export function Hero({ program }: { program: Program }) {
  return (
    <section className={styles.hero}>
      <div className={styles.text}>
        <h1>{program.name}</h1>
        {program.shortDescription && <p className={styles.subline}>{program.shortDescription}</p>}
      </div>
      <aside className={styles.booking}>
        <div className={styles.price}>See dates below</div>
        <a href="#dates" className={styles.cta}>BOOK YOUR SPOT →</a>
      </aside>
    </section>
  )
}
