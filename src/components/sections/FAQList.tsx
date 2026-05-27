import type { Faq } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './FAQList.module.css'

export function FAQList({ items, heading = 'FAQ' }: { items: Faq[]; heading?: string }) {
  if (!items.length) return null
  return (
    <section className={styles.section}>
      <h2>{heading}</h2>
      <dl className={styles.list}>
        {items.map(faq => (
          <div key={faq.id} className={styles.item}>
            <dt>{faq.question}</dt>
            <dd>
              <Lexical data={faq.answer} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
