import { tripCopy } from './trip-copy'
import { Lexical } from '@/lib/lexical'
import styles from '@/components/sections/EventAccommodationLogistics.module.css'
import type { Event } from '@/payload-types'
import { EventAccommodationLogistics } from '@/components/sections/EventAccommodationLogistics'
import type { BlockRenderContext } from './RenderBlocks'

type TripLogisticsBlockProps = Record<string, unknown>

export function TripLogisticsBlock(
  block: TripLogisticsBlockProps,
  { event, trip }: BlockRenderContext,
) {
  if (!isEvent(event)) return null

  const copy = tripCopy(trip, 'logistics', block, { heading: 'Everything Sorted' })
  const packageCopy = tripCopy(
    trip,
    'package',
    {},
    { heading: 'Full Package', eyebrow: "What's Included" },
  )
  const cards = trip?.editorial?.practicalCards?.filter((card) => card.heading || card.body)
  const packageItems = trip?.editorial?.packageItems?.filter((item) => item.text)
  const accommodation = trip?.accommodation ?? event.accommodation
  const transport = trip?.transport ?? event.transport
  const overrides = trip?.logisticsOverrides
  const separatePackage = !!(
    cards?.length ||
    packageItems?.length ||
    trip?.editorial?.packageNote ||
    trip?.editorial?.sections?.some((section) => section.key === 'package') ||
    copy.hide
  )

  const logistics = copy.hide ? null : cards?.length ? (
    <section className={`${styles.section} ${styles.cards}`}>
      <div className={styles.inner}>
        {copy.eyebrow && (
          <p data-eyebrow="section" className={styles.eyebrow}>
            {copy.eyebrow}
          </p>
        )}
        {copy.heading && <h2>{copy.heading}</h2>}
        {copy.intro && <p>{copy.intro}</p>}
        <div className={styles.twoCol}>
          {cards.map((card, index) => (
            <div className={styles.box} key={index}>
              <h3>{card.heading}</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  ) : (
    <EventAccommodationLogistics
      accommodation={
        separatePackage ? { ...accommodation, included: [], notIncluded: [] } : accommodation
      }
      variant={block.variant === 'cards' ? 'cards' : undefined}
      logisticsOverrides={
        separatePackage ? { ...overrides, included: null, excluded: null, note: null } : overrides
      }
      eyebrow={copy.eyebrow}
      heading={copy.heading}
      intro={copy.intro}
      transport={transport}
    />
  )

  if (!separatePackage || packageCopy.hide) return logistics
  const includedOverride = hasRichText(overrides?.included) ? overrides?.included : undefined
  const excludedOverride = hasRichText(overrides?.excluded) ? overrides?.excluded : undefined
  const note = trip?.editorial?.packageNote
  const legacyNote = hasRichText(overrides?.note) ? overrides?.note : undefined
  const hasPackage =
    packageItems?.length ||
    includedOverride ||
    excludedOverride ||
    accommodation?.included?.length ||
    accommodation?.notIncluded?.length ||
    note ||
    legacyNote
  if (!hasPackage) return logistics

  return (
    <>
      {logistics}
      <section className={`${styles.section} ${styles.cards}`}>
        <div className={styles.inner}>
          {packageCopy.eyebrow && (
            <p data-eyebrow="section" className={styles.eyebrow}>
              {packageCopy.eyebrow}
            </p>
          )}
          {packageCopy.heading && <h2>{packageCopy.heading}</h2>}
          {packageCopy.intro && <p>{packageCopy.intro}</p>}
          {packageItems?.length ? (
            <ul className={styles.bullets}>
              {packageItems.map((item, index) => (
                <li key={index}>{item.text}</li>
              ))}
            </ul>
          ) : includedOverride ? (
            <Lexical data={includedOverride} />
          ) : (
            <PackageList items={accommodation?.included} />
          )}
          {(excludedOverride || accommodation?.notIncluded?.length) && (
            <div className={styles.box}>
              <p className={`${styles.listLabel} ${styles.listLabelNot}`}>Not included</p>
              {excludedOverride ? (
                <Lexical data={excludedOverride} />
              ) : (
                <PackageList items={accommodation?.notIncluded} />
              )}
            </div>
          )}
          {note ? (
            <p style={{ whiteSpace: 'pre-line' }}>{note}</p>
          ) : (
            legacyNote && <Lexical data={legacyNote} />
          )}
        </div>
      </section>
    </>
  )
}

function PackageList({ items }: { items?: { text: string }[] | null }) {
  return items?.length ? (
    <ul className={styles.bullets}>
      {items.map((item, index) => (
        <li key={index}>{item.text}</li>
      ))}
    </ul>
  ) : null
}

function hasRichText(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const node = value as { text?: unknown; type?: unknown; root?: unknown; children?: unknown[] }
  return (
    (typeof node.text === 'string' && !!node.text.trim()) ||
    node.type === 'upload' ||
    node.type === 'block' ||
    node.type === 'horizontalrule' ||
    hasRichText(node.root) ||
    !!node.children?.some(hasRichText)
  )
}

function isEvent(event: BlockRenderContext['event']): event is Event {
  return typeof event === 'object' && event !== null
}
