import type { Type } from '@/payload-types'
import styles from './ProgramFlow.module.css'

export function ProgramFlow({ flow }: { flow?: Type['programFlow'] }) {
  if (!flow) return null
  const { framingParagraph, mixAndMatchBlocks, tailoredToYou, focusTracks } = flow
  const hasAnything =
    framingParagraph ||
    mixAndMatchBlocks?.length ||
    tailoredToYou?.length ||
    focusTracks?.length
  if (!hasAnything) return null

  return (
    <section className={styles.section}>
      <h2>Program &amp; Daily Flow</h2>
      {framingParagraph && <p className={styles.framing}>{framingParagraph}</p>}

      {mixAndMatchBlocks?.length ? (
        <>
          <h3 className={styles.h3}>Key elements we mix and match</h3>
          <ol className={styles.blocks}>
            {mixAndMatchBlocks.map((b, i) => (
              <li key={i} className={styles.block}>
                <h4>
                  {i + 1}. {b.title}
                </h4>
                {b.tagline && <p className={styles.tagline}>{b.tagline}</p>}
                {b.bullets?.length ? (
                  <ul>
                    {b.bullets.map((x, j) => (
                      <li key={j}>{x.text}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {tailoredToYou?.length ? (
        <>
          <h3 className={styles.h3}>Tailored to you</h3>
          <ul className={styles.tailored}>
            {tailoredToYou.map((b, i) => (
              <li key={i}>{b.text}</li>
            ))}
          </ul>
        </>
      ) : null}

      {focusTracks?.length ? (
        <>
          <h3 className={styles.h3}>Example focus tracks</h3>
          <div className={styles.tracks}>
            {focusTracks.map((t, i) => (
              <div
                key={i}
                className={`${styles.track} ${styles[`color-${t.colorTag ?? 'blue'}`]}`}
              >
                <h4>{t.title}</h4>
                {t.bullets?.length ? (
                  <ul>
                    {t.bullets.map((x, j) => (
                      <li key={j}>{x.text}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
