import Image from 'next/image'
import type { Event, EventDate } from '@/payload-types'
import styles from './DetailHero.module.css'

export function DetailHero({
  event,
  firstDate,
}: {
  event: Event
  firstDate?: EventDate
}) {
  const mainPic =
    typeof event.mainPicture === 'object' && event.mainPicture
      ? event.mainPicture
      : null

  return (
    <section className={styles.hero}>
      {mainPic?.url && (
        <Image
          src={mainPic.url}
          alt={mainPic.alt || event.title}
          fill
          priority
          className={styles.image}
          sizes="100vw"
        />
      )}
      <div className={styles.overlay} />
      <div className={styles.text}>
        <h1 className={styles.title}>{event.title}</h1>
        {event.shortDescription && (
          <p className={styles.lead}>{event.shortDescription}</p>
        )}
        {firstDate && (
          <p className={styles.meta}>
            From {firstDate.currency} {firstDate.price.toLocaleString()} · per person
          </p>
        )}
      </div>
    </section>
  )
}
