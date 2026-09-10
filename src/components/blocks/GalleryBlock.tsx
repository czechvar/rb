import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'
import { ImageTripCard } from '@/components/catalogue/ImageTripCard'
import imageCardStyles from '@/components/catalogue/ImageTripCard.module.css'

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

  const isDestinationStrip = variant === 'tiles' && Boolean(props.context?.location)
  const className = [
    styles.gallerySection,
    variant === 'masonry' ? styles.galleryMasonry : '',
    variant === 'tiles' ? styles.galleryTiles : '',
    isDestinationStrip ? styles.galleryDestinationStrip : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        {heading || body || eyebrow ? (
          <div className={styles.sectionHeader}>
            {eyebrow ? <p data-eyebrow="section" className={styles.eyebrow}>{eyebrow}</p> : null}
            {heading ? <h2>{heading}</h2> : null}
            {body ? <p className={styles.lead}>{body}</p> : null}
          </div>
        ) : null}
        <div className={variant === 'featureLead' ? imageCardStyles.grid : styles.galleryGrid}>
          {resolved.map((image, index) => variant === 'featureLead' ? (
            <ImageTripCard key={typeof image === 'object' ? image.id : index} variant="photo" image={mediaUrl(image) ?? ''} alt={mediaAlt(image)} featured={index === 0} />
          ) : (
            <figure key={typeof image === 'object' ? image.id : index} className={styles.galleryItem}>
              <Image
                src={mediaUrl(image) ?? ''}
                alt={mediaAlt(image)}
                fill
                sizes={isDestinationStrip ? '(max-width: 768px) 25vw, 25vw' : '(max-width: 768px) 100vw, 33vw'}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
