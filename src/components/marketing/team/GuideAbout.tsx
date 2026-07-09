import type { Guide } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './GuideAbout.module.css'

function Headline({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((raw, i) => {
        const line = raw.trim()
        if (!line) return null
        const accent = line.length > 2 && line.startsWith('*') && line.endsWith('*')
        return (
          <span key={i} className={accent ? styles.accent : undefined}>
            {accent ? line.slice(1, -1) : line}
            <br />
          </span>
        )
      })}
    </>
  )
}

export function GuideAbout({ guide }: { guide: Guide }) {
  const about = guide.about
  const hasLeft = Boolean(about?.headline || guide.content)
  const hasRight = Boolean(about?.facts?.length || about?.quote)
  if (!hasLeft && !hasRight) return null
  const first = guide.name.split(' ')[0]

  return (
    <section className={styles.section} id="about">
      <div className={styles.grid}>
        {hasLeft ? (
          <div className="reveal">
            <p className={`section-label ${styles.label}`}>The Coach</p>
            {about?.headline ? (
              <h2 className={`section-title ${styles.heading}`}>
                <Headline text={about.headline} />
              </h2>
            ) : null}
            {guide.content ? (
              <div className={styles.bio}>
                <Lexical data={guide.content} />
              </div>
            ) : null}
          </div>
        ) : null}
        {hasRight ? (
          <div className="reveal">
            {about?.facts?.length ? (
              <div className={styles.factsCard}>
                {about.facts.map((f) => (
                  <div key={f.id ?? f.label} className={styles.factsRow}>
                    <span className={styles.factsLabel}>{f.label}</span>
                    <span className={styles.factsValue}>{f.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {about?.quote ? (
              <div className={styles.quoteBlock}>
                <span className={styles.quoteName}>{first}</span>
                {guide.role ? <span className={styles.quoteRole}>{guide.role}</span> : null}
                <blockquote className={styles.quote}>{about.quote}</blockquote>
                {about.quoteAttribution ? (
                  <span className={styles.quoteAttr}>{about.quoteAttribution}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
