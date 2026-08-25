import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import styles from './blocks.module.css'

type GalleryBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'gallery' }
>

export function GalleryBlock({ body, eyebrow, heading, images, variant }: GalleryBlockProps) {
  const resolved = (images ?? []).filter((image) => mediaUrl(image))
  if (resolved.length === 0) return null

  const className = [
    styles.gallerySection,
    variant === 'masonry' ? styles.galleryMasonry : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        {heading || body || eyebrow ? (
          <div className={styles.sectionHeader}>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            {heading ? <h2>{heading}</h2> : null}
            {body ? <p className={styles.lead}>{body}</p> : null}
          </div>
        ) : null}
        <div className={styles.galleryGrid}>
          {resolved.map((image, index) => (
            <figure key={typeof image === 'object' ? image.id : index} className={styles.galleryItem}>
              <Image
                src={mediaUrl(image) ?? ''}
                alt={mediaAlt(image)}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
