import Link from 'next/link'
import Image from 'next/image'
import { getActiveGuides } from '@/lib/queries'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { mediaUrl, mediaAlt } from '@/lib/media'
import type { Guide } from '@/payload-types'
import styles from './team.module.css'

export const metadata = { title: 'Rockbusters Team — Rockbusters' }

function byFeaturedThenName(a: Guide, b: Guide) {
  return (
    Number(b.featured ?? false) - Number(a.featured ?? false) ||
    a.name.localeCompare(b.name)
  )
}

function GuideGrid({ guides }: { guides: Guide[] }) {
  return (
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
            {g.role ? <span className={styles.role}>{g.role}</span> : null}
          </Link>
        )
      })}
    </div>
  )
}

export default async function TeamPage() {
  const docs = await getActiveGuides()
  const team = docs.filter((g) => g.section !== 'friends').sort(byFeaturedThenName)
  const friends = docs.filter((g) => g.section === 'friends').sort(byFeaturedThenName)
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Team' }]}>
      <main className={styles.wrap}>
        <h1>Rockbusters Team</h1>
        <GuideGrid guides={team} />
        {friends.length ? (
          <>
            <h2 className={styles.sectionHeading}>Friends &amp; Ambassadors</h2>
            <GuideGrid guides={friends} />
          </>
        ) : null}
      </main>
    </MarketingShell>
  )
}
