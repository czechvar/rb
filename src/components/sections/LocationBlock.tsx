import type { Type } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './LocationBlock.module.css'

export function LocationBlock({ content }: { content?: Type['content'] }) {
  if (!content) return null
  return (
    <section className={styles.section}>
      <h2>Location</h2>
      <div className={styles.body}>
        <Lexical data={content} />
      </div>
      <div className={styles.mapPlaceholder}>[ MAP — region overview ]</div>
    </section>
  )
}
