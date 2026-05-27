import type { Type } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './AccommodationLogistics.module.css'

function BulletList({ items }: { items?: { text: string; id?: string | null }[] | null }) {
  if (!items?.length) return null
  return (
    <ul className={styles.bullets}>
      {items.map((b, i) => (
        <li key={i}>{b.text}</li>
      ))}
    </ul>
  )
}

export function AccommodationLogistics({
  accommodation,
  transport,
}: {
  accommodation?: Type['accommodation']
  transport?: Type['transport']
}) {
  const hasAccommodation =
    accommodation?.description ||
    accommodation?.included?.length ||
    accommodation?.foodBeverages?.length ||
    accommodation?.notIncluded?.length
  const hasTransport = transport?.description || transport?.airports?.length

  if (!hasAccommodation && !hasTransport) return null

  return (
    <section className={styles.section}>
      <h2>Accommodation &amp; Logistics</h2>
      <div className={styles.twoCol}>
        <div className={styles.col}>
          {hasAccommodation && (
            <div className={styles.box}>
              <h3>Accommodation</h3>
              {accommodation?.description && <Lexical data={accommodation.description} />}
            </div>
          )}
          {hasTransport && (
            <div className={styles.box}>
              <h3>Getting there</h3>
              {transport?.description && <Lexical data={transport.description} />}
              {transport?.airports?.length ? (
                <ul className={styles.bullets}>
                  {transport.airports.map((a, i) => {
                    if (typeof a === 'number') return null
                    return (
                      <li key={i}>
                        {a.name}
                        {a.iata ? ` (${a.iata})` : ''}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>
          )}
        </div>
        <div className={styles.col}>
          {accommodation?.included?.length ? (
            <div className={styles.box}>
              <h3>Included in our price ✓</h3>
              <BulletList items={accommodation.included} />
            </div>
          ) : null}
          {accommodation?.foodBeverages?.length ? (
            <div className={styles.box}>
              <h3>Food &amp; beverages</h3>
              <BulletList items={accommodation.foodBeverages} />
            </div>
          ) : null}
          {accommodation?.notIncluded?.length ? (
            <div className={styles.box}>
              <h3>Not included ✗</h3>
              <BulletList items={accommodation.notIncluded} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
