import type { Event } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './WhatYouLearn.module.css'

export function WhatYouLearn({ data }: { data?: Event['whatYouLearn'] }) {
  if (!data) return null
  const boxes = [
    data.box1Heading && {
      num: '01',
      heading: data.box1Heading,
      bullets: data.box1Bullets ?? [],
    },
    data.box2Heading && {
      num: '02',
      heading: data.box2Heading,
      bullets: data.box2Bullets ?? [],
    },
  ].filter(Boolean) as { num: string; heading: string; bullets: { text: string }[] }[]

  if (!boxes.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionIntro
          title="What you'll learn"
          lead={data.intro ?? undefined}
          align="left"
        />
        <div className={styles.grid}>
          {boxes.map((box) => (
            <div key={box.num} className={styles.pillar}>
              <div className={styles.rule} />
              <span className={styles.num}>{box.num}</span>
              <h3 className={styles.heading}>{box.heading}</h3>
              {box.bullets.length > 0 && (
                <ul className={styles.bullets}>
                  {box.bullets.map((b, j) => (
                    <li key={j}>{b.text}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
