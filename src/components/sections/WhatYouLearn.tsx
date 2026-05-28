import type { Event } from '@/payload-types'
import { Card, CardGrid } from './Card'
import { SectionIntro } from './SectionIntro'
import styles from './WhatYouLearn.module.css'

export function WhatYouLearn({ data }: { data?: Event['whatYouLearn'] }) {
  if (!data) return null
  const boxes = [
    data.box1Heading && {
      heading: data.box1Heading,
      bullets: data.box1Bullets ?? [],
    },
    data.box2Heading && {
      heading: data.box2Heading,
      bullets: data.box2Bullets ?? [],
    },
  ].filter(Boolean) as { heading: string; bullets: { text: string }[] }[]

  if (!boxes.length) return null

  return (
    <section className={styles.section}>
      <SectionIntro
        title="What you'll learn"
        lead={data.intro ?? undefined}
      />
      <CardGrid>
        {boxes.map((box, i) => (
          <Card key={i}>
            <h3 className={styles.heading}>{box.heading}</h3>
            <ul className={styles.bullets}>
              {box.bullets.map((b, j) => (
                <li key={j}>{b.text}</li>
              ))}
            </ul>
          </Card>
        ))}
      </CardGrid>
    </section>
  )
}
