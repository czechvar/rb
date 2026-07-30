import type { Faq } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './HomepageFAQ.module.css'

type HomepageFAQProps = { faqs: Faq[] }

export function HomepageFAQ({ faqs }: HomepageFAQProps) {
  if (faqs.length === 0) return null
  return (
    <section className={styles.section}>
      <p className="section-label reveal">Quick answers</p>
      <h2 className="section-title reveal">FAQ</h2>
      <div className={styles.grid}>
        {faqs.map((f) => (
          <div key={f.id} className={`${styles.item} reveal`}>
            <p className={styles.question}>{f.question}</p>
            <div className={styles.answer}>
              <Lexical data={f.answer} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
