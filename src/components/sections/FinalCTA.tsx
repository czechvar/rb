import type { Program } from '@/payload-types'
import styles from './FinalCTA.module.css'

export function FinalCTA({ program }: { program: Program }) {
  return (
    <section className={styles.band}>
      <h2>Ready to commit?</h2>
      {program.shortDescription && <p>{program.shortDescription}</p>}
      <div className={styles.buttons}>
        <a href="#dates" className={styles.primary}>BOOK YOUR SPOT →</a>
        <a href="/contact" className={styles.secondary}>ASK A QUESTION</a>
      </div>
    </section>
  )
}
