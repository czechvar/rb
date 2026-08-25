import Image from 'next/image'
import type { Location, Media, Program } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './LocationBlock.module.css'

export interface LocationBlockProps {
  /** Lexical rich-text body — the only data currently available from both callers. */
  content?: Program['content'] | Location['content']
  /** Optional Bebas display heading rendered above the eyebrow + prose
   *  (e.g. a destination name like "Kalymnos"). Only rendered when provided. */
  heading?: string
  /** Short all-caps label rendered above the content (e.g. "The Venue").
   *  Omitted when not provided. */
  eyebrow?: string
  /** Optional hero image for the left photo column.
   *  Accepts a resolved Media object, a Payload numeric ID, or null/undefined.
   *  NOT a raw URL string — pass a resolved Media object for the URL to render. */
  image?: number | Media | null | undefined
  /** Alt text override when the resolved `image` has no alt field set. */
  imageAlt?: string
}

export function LocationBlock({ content, heading, eyebrow, image, imageAlt }: LocationBlockProps) {
  if (!content) return null

  const imgUrl = image ? mediaUrl(image) : undefined
  const imgAlt = imageAlt ?? (image ? mediaAlt(image) : '')

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {heading && <h2 className={`section-title ${styles.sectionHeading}`}>{heading}</h2>}
        <div className={imgUrl ? styles.grid : undefined}>
          {/* Left: photo column — only rendered when an image is supplied */}
          {imgUrl && (
            <div className={styles.imgCol}>
              <Image
                src={imgUrl}
                alt={imgAlt}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className={styles.img}
              />
            </div>
          )}

          {/* Right: text column */}
          <div className={styles.textCol}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <div className={styles.prose}>
              <Lexical data={content} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
