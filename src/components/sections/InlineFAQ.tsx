/* ── InlineFAQ — wireframe block 9 "Common Questions" ─────────────────
 *
 * Wireframe reference:
 *   docs/html/TRIP-COURSE/.../block_09_block_9.html (.faq-section)
 *
 * Renders up to 5 FAQs for the trip detail page with a link to the full
 * /trips/[slug]/faq sub-page. Wired into the trip page in Task 16.
 *
 * Props:
 *   faqs — Faq[] already filtered + sorted by the caller (active, by position)
 *   slug — trip slug used to build the "All questions" href
 */

import Link from 'next/link'
import type { Faq } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './InlineFAQ.module.css'

type InlineFAQProps = { faqs: Faq[]; slug: string }

export function InlineFAQ({ faqs, slug }: InlineFAQProps) {
  if (faqs.length === 0) return null
  const top = faqs.slice(0, 5)
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>FAQ</p>
        <h2 className={styles.title}>Common Questions</h2>
        <div className={styles.list}>
          {top.map((f) => (
            <details key={f.id} className={styles.item}>
              <summary className={styles.q}>{f.question}</summary>
              <div className={styles.a}>
                <Lexical data={f.answer} />
              </div>
            </details>
          ))}
        </div>
        <div className={styles.footer}>
          <Link href={`/trips/${slug}/faq`} className="btn-ghost">
            All questions →
          </Link>
        </div>
      </div>
    </section>
  )
}
