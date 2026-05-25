import type { Event } from '@/payload-types'
import styles from './WhatYouLearn.module.css'

export function WhatYouLearn({ data }: { data?: Event['whatYouLearn'] }) {
  if (!data) return null
  const { intro, box1Heading, box1Bullets, box2Heading, box2Bullets } = data
  const hasAnything =
    intro ||
    box1Heading ||
    box1Bullets?.length ||
    box2Heading ||
    box2Bullets?.length
  if (!hasAnything) return null

  return (
    <section className={styles.section}>
      <h2>What You Will Learn &amp; Achieve</h2>
      {intro && <p className={styles.intro}>{intro}</p>}
      <div className={styles.grid}>
        {(box1Heading || box1Bullets?.length) && (
          <div className={styles.box}>
            {box1Heading && <h3>{box1Heading}</h3>}
            {box1Bullets?.length ? (
              <ul>
                {box1Bullets.map((b, i) => (
                  <li key={i}>{b.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
        {(box2Heading || box2Bullets?.length) && (
          <div className={styles.box}>
            {box2Heading && <h3>{box2Heading}</h3>}
            {box2Bullets?.length ? (
              <ul>
                {box2Bullets.map((b, i) => (
                  <li key={i}>{b.text}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
