import type { Event } from '@/payload-types'
import { Card, CardGrid } from './Card'
import { SectionIntro } from './SectionIntro'
import styles from './HighlightsGrid.module.css'

export function HighlightsGrid({
  items,
  heading = 'Trip Highlights',
}: {
  items?: Event['highlights']
  heading?: string
}) {
  if (!items?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro title={heading} />
      <CardGrid>
        {items.map((h, i) => (
          <Card key={i}>
            <span className={styles.icon}>✓</span>
            <p className={styles.text}>{h.text}</p>
          </Card>
        ))}
      </CardGrid>
    </section>
  )
}
