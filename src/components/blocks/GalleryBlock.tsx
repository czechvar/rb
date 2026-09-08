import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'

type GalleryBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'gallery' }
>

function galleryImages(block: GalleryBlockProps, context: BlockRenderContext) {
  if (block.source === 'currentEvent') return context.event?.gallery ?? []
  if (block.source === 'currentLocation') return context.location?.gallery ?? []
  return block.images ?? []
}

export function GalleryBlock(props: GalleryBlockProps & { context?: BlockRenderContext }) {
  const { body, eyebrow, heading, variant } = props
  const resolved = galleryImages(props, props.context ?? {}).filter((image) => mediaUrl(image))
  if (resolved.length === 0) return null

  const className = [
    styles.gallerySection,
    variant === 'masonry' ? styles.galleryMasonry : '',
    variant === 'tiles' ? styles.galleryTiles : '',
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
