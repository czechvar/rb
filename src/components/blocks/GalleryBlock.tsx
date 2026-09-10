import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { BlockRenderContext } from './RenderBlocks'
import styles from './blocks.module.css'
import variants from './GalleryBlock.module.css'

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
    variant === 'featureLead' ? variants.featureLead : '',
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
        <div className={`${styles.galleryGrid} ${variant === 'featureLead' ? variants.grid : ''}`}>
          {resolved.map((image, index) => (
            <figure key={typeof image === 'object' ? image.id : index} className={`${styles.galleryItem} ${variant === 'featureLead' ? variants.item : ''}`}>
              <Image
                src={mediaUrl(image) ?? ''}
                alt={mediaAlt(image)}
                fill
                sizes={variant === 'featureLead' ? '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 45vw' : isDestinationStrip ? '(max-width: 768px) 25vw, 25vw' : '(max-width: 768px) 100vw, 33vw'}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
