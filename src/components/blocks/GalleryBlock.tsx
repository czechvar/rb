import { tripCopy } from './trip-copy'
import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'
import { ImageTripCard } from '@/components/catalogue/ImageTripCard'
import imageCardStyles from '@/components/catalogue/ImageTripCard.module.css'

type GalleryBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'gallery' }>

function galleryImages(block: GalleryBlockProps, context: BlockRenderContext) {
  if (block.source === 'currentEvent') return context.event?.gallery ?? []
  if (block.source === 'currentLocation') return context.location?.gallery ?? []
  return block.images ?? []
}

export function GalleryBlock(props: GalleryBlockProps & { context?: BlockRenderContext }) {
  const { variant } = props
  const copy =
    props.source === 'currentEvent'
      ? tripCopy(props.context?.trip, 'gallery', props)
      : { ...props, intro: props.body, hide: false }
  const { eyebrow, heading, intro: body } = copy
  if (copy.hide) return null
  const resolved = galleryImages(props, props.context ?? {}).filter((image) => mediaUrl(image))
  const authored =
    props.source === 'currentEvent' &&
    props.context?.trip?.editorial?.sections?.some((section) => section.key === 'gallery')
  if (resolved.length === 0 && !authored) return null
  // The detail reference presents five photos; retain the complete source gallery.
  const visible = variant === 'featureLead' ? resolved.slice(0, 5) : resolved

  const isDestinationStrip = variant === 'tiles' && Boolean(props.context?.location)
  const className = [
    styles.gallerySection,
    variant === 'featureLead' ? styles.galleryFeatureLead : '',
    variant === 'masonry' ? styles.galleryMasonry : '',
    variant === 'tiles' ? styles.galleryTiles : '',
    isDestinationStrip ? styles.galleryDestinationStrip : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={className}>
      <div className={styles.sectionInner}>
        {heading || body || eyebrow ? (
          <div className={styles.sectionHeader}>
            {eyebrow ? (
              <p data-eyebrow="section" className={styles.eyebrow}>
                {eyebrow}
              </p>
            ) : null}
            {heading ? <h2>{heading}</h2> : null}
            {body ? <p className={styles.lead}>{body}</p> : null}
          </div>
        ) : null}
        {visible.length > 0 && (
          <div
            className={
              variant === 'featureLead'
                ? `${imageCardStyles.grid} ${imageCardStyles.photoGrid}`
                : styles.galleryGrid
            }
          >
            {visible.map((image, index) =>
              variant === 'featureLead' ? (
                <ImageTripCard
                  key={typeof image === 'object' ? image.id : index}
                  variant="photo"
                  image={mediaUrl(image) ?? ''}
                  alt={mediaAlt(image)}
                  featured={index === 0}
                />
              ) : (
                <figure
                  key={typeof image === 'object' ? image.id : index}
                  className={styles.galleryItem}
                >
                  <Image
                    src={mediaUrl(image) ?? ''}
                    alt={mediaAlt(image)}
                    fill
                    sizes={
                      isDestinationStrip
                        ? '(max-width: 768px) 25vw, 25vw'
                        : '(max-width: 768px) 100vw, 33vw'
                    }
                  />
                </figure>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  )
}
