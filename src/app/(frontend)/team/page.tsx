import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { mediaUrl, mediaAlt } from '@/lib/media'
import styles from './team.module.css'

export const metadata = { title: 'Rockbusters Team — Rockbusters' }

export default async function TeamPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'guides',
    where: { active: { equals: true } },
    limit: 100,
    depth: 1,
  })
  const guides = [...docs].sort(
    (a, b) =>
      Number(b.featured ?? false) - Number(a.featured ?? false) ||
      a.name.localeCompare(b.name),
  )
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Team' }]}>
      <main className={styles.wrap}>
        <h1>Rockbusters Team</h1>
        <div className={styles.grid}>
          {guides.map((g) => {
            const url = mediaUrl(g.photo)
            return (
              <Link key={g.id} href={`/team/${g.slug}`} className={styles.card}>
                {url ? (
                  <Image
                    src={url}
                    alt={mediaAlt(g.photo)}
                    width={280}
                    height={280}
                    className={styles.photo}
                  />
                ) : (
                  <span className={styles.photoPlaceholder} aria-hidden="true" />
                )}
                <span className={styles.name}>{g.name}</span>
              </Link>
            )
          })}
        </div>
      </main>
    </MarketingShell>
  )
}
