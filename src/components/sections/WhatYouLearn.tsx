import type { Event } from '@/payload-types'
import { SectionIntro, type SectionIntroVariant } from './SectionIntro'
import styles from './WhatYouLearn.module.css'

export function WhatYouLearn({ data, headingVariant, eyebrow, variant }: { data?: Event['whatYouLearn']; headingVariant?: SectionIntroVariant; eyebrow?: string; variant?: 'pillars' }) {
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
    data.box3Heading && {
      num: '03',
      heading: data.box3Heading,
      bullets: data.box3Bullets ?? [],
    },
  ].filter(Boolean) as { num: string; heading: string; bullets: { text: string }[] }[]

  if (!boxes.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <SectionIntro eyebrow={eyebrow} variant={headingVariant}
          title="What you'll learn"
          lead={data.intro ?? undefined}
          align="left"
        />
        <div className={`${styles.grid} ${variant === 'pillars' ? styles.pillars : ''}`}>
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
