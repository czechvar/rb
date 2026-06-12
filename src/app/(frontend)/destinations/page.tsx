import Link from 'next/link'
import Image from 'next/image'
import { getPayloadClient } from '@/lib/payload'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { mediaUrl, mediaAlt } from '@/lib/media'
import type { Location } from '@/payload-types'
import styles from './destinations.module.css'

export const metadata = { title: 'Destinations — Rockbusters' }

function countryAnchor(country: string) {
  return country.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export default async function DestinationsPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'locations',
    where: { active: { equals: true } },
    limit: 200,
    depth: 1,
  })
  const byCountry = new Map<string, Location[]>()
  for (const loc of docs) {
    const key = loc.country ?? 'Elsewhere'
    byCountry.set(key, [...(byCountry.get(key) ?? []), loc])
  }
  const countries = [...byCountry.keys()].sort((a, b) => a.localeCompare(b))
  return (
    <MarketingShell crumbs={[{ href: '/', label: 'Home' }, { label: 'Destinations' }]}>
      <main className={styles.wrap}>
        <h1>Destinations</h1>
        {countries.map((country) => (
          <section key={country}>
            <h2 className={styles.countryHeading} id={countryAnchor(country)}>
              {country}
            </h2>
            <div className={styles.grid}>
              {(byCountry.get(country) ?? [])
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((loc) => {
                  const url = mediaUrl(loc.mainPicture)
                  return (
                    <Link key={loc.id} href={`/destinations/${loc.slug}`} className={styles.card}>
                      {url ? (
                        <Image
                          src={url}
                          alt={mediaAlt(loc.mainPicture)}
                          width={360}
                          height={240}
                          className={styles.photo}
                        />
                      ) : (
                        <span className={styles.photoPlaceholder} aria-hidden="true" />
                      )}
                      <span className={styles.name}>{loc.name}</span>
                    </Link>
                  )
                })}
            </div>
          </section>
        ))}
      </main>
    </MarketingShell>
  )
}
