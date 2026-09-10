import Image from 'next/image'
import styles from './ImageTripCard.module.css'

export type ImageTripCardProps = {
  href: string
  title: string
  description?: string | null
  image?: string | null
  category?: string | null
  location?: string | null
  schedule?: string | null
  price?: string | null
  featured?: boolean
  headingLevel?: 3 | 4
}

/** Shared presentation only; callers retain Event/Event Date selection. */
export function ImageTripCard({
  href, title, description, image, category, location, schedule, price,
  featured = false, headingLevel = 3,
}: ImageTripCardProps) {
  const Heading = headingLevel === 4 ? 'h4' : 'h3'

  return (
    <a className={[styles.card, featured ? styles.featured : ''].filter(Boolean).join(' ')} href={href}>
      <span className={styles.media} aria-hidden="true">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes={featured
              ? '(max-width: 560px) 90vw, (max-width: 900px) 45vw, 60vw'
              : '(max-width: 560px) 90vw, (max-width: 900px) 45vw, 30vw'}
          />
        ) : null}
      </span>
      <span className={styles.overlay} aria-hidden="true" />
      <div className={styles.top}>
        <span className={styles.badge}>{category || 'Rockbusters trip'}</span>
        <div className={styles.meta}>
          {location ? <span className={styles.location}>{location}</span> : null}
          {schedule ? <span className={styles.schedule}>{schedule}</span> : null}
        </div>
      </div>
      <div className={styles.content}>
        <Heading className={styles.title}>{title}</Heading>
        {description ? <p className={styles.description}>{description}</p> : null}
        <div className={styles.footer}>
          <span className={styles.price}>{price || 'Upcoming dates'}</span>
          <span className={styles.cta}>View trip details <span aria-hidden="true">→</span></span>
        </div>
      </div>
    </a>
  )
}
