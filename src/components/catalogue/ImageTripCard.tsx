import Image from 'next/image'
import styles from './ImageTripCard.module.css'

type TripLinkProps = {
  variant?: 'trip'
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

export type ImageTripCardProps = TripLinkProps | {
  variant: 'photo'
  image: string
  alt: string
  featured?: boolean
}

/** Shared presentation only; callers retain Event/Event Date selection. */
export function ImageTripCard(props: ImageTripCardProps) {
  const { image, featured = false } = props
  const className = [styles.card, featured ? styles.featured : '', props.variant === 'photo' ? styles.photo : ''].filter(Boolean).join(' ')
  const media = (
    <span className={styles.media} aria-hidden={props.variant === 'photo' ? undefined : true}>
      {image ? (
        <Image
          src={image}
          alt={props.variant === 'photo' ? props.alt : ''}
          fill
          sizes={featured
            ? '(max-width: 560px) 90vw, (max-width: 900px) 45vw, 60vw'
            : '(max-width: 560px) 90vw, (max-width: 900px) 45vw, 30vw'}
        />
      ) : null}
    </span>
  )
  if (props.variant === 'photo') return <figure className={className}>{media}</figure>

  const { href, title, description, category, location, schedule, price, headingLevel = 3 } = props
  const Heading = headingLevel === 4 ? 'h4' : 'h3'
  return (
    <a className={className} href={href}>
      {media}
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
