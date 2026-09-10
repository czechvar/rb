import type { Event, EventDate } from '@/payload-types'
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
  heading = 'Everything Sorted',
  transport,
  variant,
  logisticsOverrides,
}: {
  variant?: 'cards'
  logisticsOverrides?: EventDate['logisticsOverrides']
  accommodation?: Event['accommodation']
  heading?: string
  transport?: Event['transport']
}) {
  const includedOverride = hasContent(logisticsOverrides?.included) ? logisticsOverrides?.included : undefined
  const excludedOverride = hasContent(logisticsOverrides?.excluded) ? logisticsOverrides?.excluded : undefined
  const note = hasContent(logisticsOverrides?.note) ? logisticsOverrides?.note : undefined
  const hasAccommodation =
    includedOverride || excludedOverride ||
    accommodation?.description ||
    accommodation?.included?.length ||
    accommodation?.notIncluded?.length ||
    accommodation?.cuisineHighlights
  const hasTransport = transport?.description || transport?.airports?.length

  if (!hasAccommodation && !hasTransport && !note) return null

  return (
    <section className={`${styles.section} ${variant === 'cards' ? styles.cards : ''}`}>
      <div className={styles.inner}>
        <h2>{heading}</h2>
        <div className={styles.twoCol}>
          {hasAccommodation && (
            <div className={styles.col}>
              <div className={styles.box}>
                <h3>Accommodation</h3>
                {accommodation?.description && (
                  <Lexical data={accommodation.description} />
                )}
                {includedOverride ? <><p className={styles.listLabel}>Included in our price</p><Lexical data={includedOverride} /></> : accommodation?.included?.length ? (
                  <>
                    <p className={styles.listLabel}>Included in our price</p>
                    <BulletList items={accommodation.included} />
                  </>
                ) : null}
                {excludedOverride ? <><p className={styles.listLabel}>Not included</p><Lexical data={excludedOverride} /></> : accommodation?.notIncluded?.length ? (
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
        {note ? <div className={styles.box}><Lexical data={note} /></div> : null}
      </div>
    </section>
  )
}

function hasContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const node = value as { text?: unknown; type?: unknown; root?: unknown; children?: unknown[] }
  if (typeof node.text === 'string' && node.text.trim()) return true
  if (node.type === 'upload' || node.type === 'block' || node.type === 'horizontalrule') return true
  return hasContent(node.root) || Boolean(node.children?.some(hasContent))
}
