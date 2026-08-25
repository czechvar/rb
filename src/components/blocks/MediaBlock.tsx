import Image from 'next/image'
import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { safeVideoUrl } from '@/lib/video'
import styles from './blocks.module.css'

type MediaBlockProps = Extract<NonNullable<Page['layout']>[number], { blockType: 'mediaBlock' }>

export function MediaBlock({ body, caption, heading, eyebrow, media, source, variant, videoUrl }: MediaBlockProps) {
  const imageUrl = mediaUrl(media)
  const safeVideo = safeVideoUrl(videoUrl)
  const className = [
    styles.mediaSection,
    variant === 'contained' ? styles.mediaContained : '',
    variant === 'split' ? styles.mediaSplit : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (source === 'upload' && !imageUrl) return null
  if (source === 'externalVideo' && !safeVideo) return null

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
        <figure className={styles.mediaFrame}>
          {source === 'upload' && imageUrl ? (
            <Image
              src={imageUrl}
              alt={mediaAlt(media)}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          ) : null}
          {source === 'externalVideo' && safeVideo ? (
            <iframe
              src={safeVideo}
              title={heading || 'Video'}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : null}
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      </div>
    </section>
  )
}
