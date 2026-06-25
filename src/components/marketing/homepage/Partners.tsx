import Image from 'next/image'
import type { Partner, Media } from '@/payload-types'
import styles from './Partners.module.css'

type PartnersProps = { partners: Partner[] }

function logoUrl(logo: Partner['logo']): string | null {
  if (!logo || typeof logo !== 'object') return null
  return (logo as Media).url ?? null
}

export function Partners({ partners }: PartnersProps) {
  if (partners.length === 0) return null
  return (
    <section className={styles.section}>
      <p className={styles.label}>Trusted by the best brands in climbing</p>
      <div className={styles.row}>
        {partners.map((p) => {
          const url = logoUrl(p.logo)
          return (
            <span key={p.id} className={styles.name}>
              {url ? (
                <Image src={url} alt={p.name} width={120} height={32} className={styles.logo} />
              ) : (
                p.name
              )}
            </span>
          )
        })}
      </div>
    </section>
  )
}
