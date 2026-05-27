import type { Type } from '@/payload-types'
import styles from './FinalCTA.module.css'

export function FinalCTA({ type }: { type: Type }) {
  return (
    <section className={styles.band}>
      <h2>Ready to commit?</h2>
      {type.shortDescription && <p>{type.shortDescription}</p>}
      <div className={styles.buttons}>
        <a href="#dates" className={styles.primary}>BOOK YOUR SPOT →</a>
        <a href="/contact" className={styles.secondary}>ASK A QUESTION</a>
      </div>
    </section>
  )
}
