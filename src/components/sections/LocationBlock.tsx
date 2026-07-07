import Image from 'next/image'
import type { Type } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './LocationBlock.module.css'

export interface LocationBlockProps {
  /** Lexical rich-text body — the only data currently available from both callers.
   *  A third consumer (main trip page, wired in a later task) will pass image +
   *  facts via the optional props below. */
  content?: Type['content']
  /** Short all-caps label rendered above the content (e.g. "The Venue").
   *  Omitted when not provided. */
  eyebrow?: string
  /** Optional hero image for the left photo column.
   *  Accepts a resolved Media object or a raw URL string. */
  image?: Parameters<typeof mediaUrl>[0]
  /** Alt text override when `image` is a raw URL string. */
  imageAlt?: string
}

export function LocationBlock({ content, eyebrow, image, imageAlt }: LocationBlockProps) {
  if (!content) return null

  const imgUrl = image ? mediaUrl(image) : undefined
  const imgAlt = imageAlt ?? (image ? mediaAlt(image) : '')

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
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
