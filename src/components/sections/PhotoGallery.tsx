import Image from 'next/image'
import type { Event, Media } from '@/payload-types'
import { SectionIntro } from './SectionIntro'
import styles from './PhotoGallery.module.css'

export function PhotoGallery({ items }: { items?: Event['gallery'] }) {
  const photos = (items ?? []).filter(
    (m): m is Media => typeof m === 'object' && m !== null && !!m.url,
  )
  if (!photos.length) return null
  return (
    <section className={styles.section}>
      <SectionIntro title="Photo gallery" />
      <div className={styles.grid}>
        {photos.map((photo) => (
          <div key={photo.id} className={styles.tile}>
            <Image
              src={photo.url!}
              alt={photo.alt || ''}
              width={photo.width ?? 800}
              height={photo.height ?? 600}
              className={styles.image}
              sizes="(max-width: 767px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
