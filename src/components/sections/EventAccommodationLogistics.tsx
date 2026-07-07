import type { Event } from '@/payload-types'
import { Lexical } from '@/lib/lexical'
import styles from './EventAccommodationLogistics.module.css'

function BulletList({
  items,
}: {
  items?: { text: string; id?: string | null }[] | null
}) {
  if (!items?.length) return null
  return (
    <ul className={styles.bullets}>
      {items.map((b, i) => (
        <li key={i}>{b.text}</li>
      ))}
    </ul>
  )
}

export function EventAccommodationLogistics({
  accommodation,
  transport,
}: {
  accommodation?: Event['accommodation']
  transport?: Event['transport']
}) {
  const hasAccommodation =
    accommodation?.description ||
    accommodation?.included?.length ||
    accommodation?.notIncluded?.length ||
    accommodation?.cuisineHighlights
  const hasTransport = transport?.description || transport?.airports?.length

  if (!hasAccommodation && !hasTransport) return null

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2>Everything Sorted</h2>
        <div className={styles.twoCol}>
          {hasAccommodation && (
            <div className={styles.col}>
              <div className={styles.box}>
                <h3>Accommodation</h3>
                {accommodation?.description && (
                  <Lexical data={accommodation.description} />
                )}
                {accommodation?.included?.length ? (
                  <>
                    <p className={styles.listLabel}>Included in our price</p>
                    <BulletList items={accommodation.included} />
                  </>
                ) : null}
                {accommodation?.notIncluded?.length ? (
                  <>
                    <p className={styles.listLabel + ' ' + styles.listLabelNot}>Not included</p>
                    <BulletList items={accommodation.notIncluded} />
                  </>
                ) : null}
                {accommodation?.cuisineHighlights && (
                  <Lexical data={accommodation.cuisineHighlights} />
                )}
              </div>
            </div>
          )}
          {hasTransport && (
            <div className={styles.col}>
              <div className={styles.box}>
                <h3>Getting There</h3>
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
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
