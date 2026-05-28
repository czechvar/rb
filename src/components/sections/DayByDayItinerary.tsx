import Image from 'next/image'
import type { Event } from '@/payload-types'
import { mediaUrl, mediaAlt } from '@/lib/media'
import { SectionIntro } from './SectionIntro'
import styles from './DayByDayItinerary.module.css'

export function DayByDayItinerary({ data }: { data?: Event['itinerary'] }) {
  if (!data?.days?.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro title="Daily flow" lead={data.intro ?? undefined} />
      <ol className={styles.days}>
        {data.days.map((day, i) => {
          const url = mediaUrl(day.image)
          return (
            <li key={i} className={styles.day}>
              <div className={styles.imgCol}>
                {url ? (
                  <Image
                    src={url}
                    alt={mediaAlt(day.image)}
                    width={320}
                    height={220}
                    className={styles.img}
                  />
                ) : (
                  <div className={styles.imgPlaceholder}>
                    {day.destinationIcon ?? '📍'}
                  </div>
                )}
                {day.dayBadge && <div className={styles.dayBadge}>{day.dayBadge}</div>}
                <div className={styles.destinationName}>{day.destinationName}</div>
                {day.metaLine && <div className={styles.metaLine}>{day.metaLine}</div>}
              </div>
              <div className={styles.body}>
                {day.eyebrow && <div className={styles.eyebrow}>{day.eyebrow}</div>}
                {day.heading && <h3>{day.heading}</h3>}
                {day.description && <p className={styles.description}>{day.description}</p>}
                {day.highlightTags?.length ? (
                  <div className={styles.tags}>
                    {day.highlightTags.map((t, j) => (
                      <span key={j} className={styles.tag}>
                        {t.text}
                      </span>
                    ))}
                  </div>
                ) : null}
                {day.schedule?.length ? (
                  <table className={styles.schedule}>
                    <tbody>
                      {day.schedule.map((row, j) => (
                        <tr key={j}>
                          <th>{row.time}</th>
                          <td>{row.activity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
