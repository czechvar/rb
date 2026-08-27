import type { Page } from '@/payload-types'
import { safeVideoUrl } from '@/lib/video'
import styles from './blocks.module.css'

type VideoBlockProps = Extract<
  NonNullable<Page['layout']>[number],
  { blockType: 'video' }
>

export function VideoBlock({ body, caption, eyebrow, heading, variant, videoUrl }: VideoBlockProps) {
  const safeVideo = safeVideoUrl(videoUrl)
  if (!safeVideo) return null

  const className = [
    styles.videoSection,
    variant === 'contained' ? styles.videoContained : '',
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
        <figure className={styles.mediaFrame}>
          <iframe
            src={safeVideo}
            title={heading || 'Video'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      </div>
    </section>
  )
}
