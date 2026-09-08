'use client'

import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  facetOptions,
  filterCatalogueResults,
  groupCatalogueResultsByMonth,
  parseCatalogueFilters,
  sortCatalogueResults,
  updateCatalogueSearch,
  type CatalogueFacetKey,
  type CatalogueResult,
  type CatalogueSort,
} from '@/lib/catalogue-results'
import styles from './catalogue-results.module.css'

type Props = {
  results: CatalogueResult[]
  enabledFacets: CatalogueFacetKey[]
  defaultSort?: CatalogueSort
  resultLimit?: number
  paginationMode?: 'showMore' | 'all'
  presentation?: 'calendar' | 'compact'
  stickyFilters?: boolean
}

const facetLabels: Record<CatalogueFacetKey, string> = {
  category: 'Type',
  difficulty: 'Difficulty',
  location: 'Destination',
  month: 'Month',
  guide: 'Guide',
}

export function CatalogueResultsClient({
  results,
  enabledFacets,
  defaultSort = 'date',
  resultLimit = 12,
  paginationMode = 'showMore',
  presentation = 'calendar',
  stickyFilters = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = useMemo(
    () => parseCatalogueFilters(searchParams, results, enabledFacets),
    [enabledFacets, results, searchParams],
  )
  const [visibleCount, setVisibleCount] = useState(resultLimit)
  const [isPending, startTransition] = useTransition()
  const options = useMemo(() => facetOptions(results), [results])
  const filtered = useMemo(
    () => sortCatalogueResults(filterCatalogueResults(results, filters), defaultSort),
    [defaultSort, filters, results],
  )
  const visible = paginationMode === 'all' ? filtered : filtered.slice(0, visibleCount)
  const groups = groupCatalogueResultsByMonth(visible)
  const hasFilters = Object.keys(filters).length > 0

  function setFilters(nextFilters: typeof filters) {
    setVisibleCount(resultLimit)
    const query = updateCatalogueSearch(searchParams, nextFilters)
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  return (
    <div className={styles.results} aria-busy={isPending} aria-live="polite">
      <div className={[styles.filters, stickyFilters ? styles.filtersSticky : ''].filter(Boolean).join(' ')}>
        <div className={styles.filterControls}>
          {enabledFacets.map((facet) => {
            const values = options[facet]
            if (!values.length) return null
            return (
              <label className={styles.filter} key={facet}>
                <span>{facetLabels[facet]}</span>
                <select
                  value={filters[facet] ?? ''}
                  onChange={(event) => setFilters({ ...filters, [facet]: event.target.value || undefined })}
                >
                  <option value="">All</option>
                  {values.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            )
          })}
        </div>
        {hasFilters ? (
          <div className={styles.activeFilters} aria-label="Active filters">
            {enabledFacets.flatMap((facet) => filters[facet] ? [{ facet, value: filters[facet]! }] : []).map(({ facet, value }) => (
              <button className={styles.chip} key={facet} type="button" onClick={() => setFilters({ ...filters, [facet]: undefined })}>
                {facetLabels[facet]}: {options[facet].find((option) => option.value === value)?.label} <span aria-hidden="true">x</span>
              </button>
            ))}
            <button className={styles.reset} type="button" onClick={() => setFilters({})}>Reset</button>
          </div>
        ) : null}
      </div>

      <p className={styles.count}>{isPending ? 'Updating trips...' : `${filtered.length} ${filtered.length === 1 ? 'trip' : 'trips'} available`}</p>
      {groups.length ? (
        <div className={presentation === 'compact' ? styles.compactGroups : styles.calendarGroups}>
          {groups.map((group) => (
            <section className={styles.monthGroup} key={group.value} aria-labelledby={`month-${group.value}`}>
              <div className={styles.monthHeading}>
                <h3 id={`month-${group.value}`}>{group.label}</h3>
                <span>{group.items.length} {group.items.length === 1 ? 'trip' : 'trips'}</span>
              </div>
              {presentation === 'compact' ? (
                <div className={styles.tripList}>
                  {group.items.map((trip) => <CompactTrip key={trip.id} trip={trip} />)}
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {group.items.map((trip, index) => <CalendarTrip key={trip.id} trip={trip} featured={index === 0} />)}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : <p className={styles.empty}>No upcoming trips match these filters.</p>}
      {paginationMode === 'showMore' && visible.length < filtered.length ? (
        <button className={styles.more} type="button" onClick={() => setVisibleCount((count) => count + resultLimit)}>Show more trips</button>
      ) : null}
    </div>
  )
}

function CompactTrip({ trip }: { trip: CatalogueResult }) {
  return (
    <a className={styles.trip} href={trip.href}>
      <time dateTime={trip.dateFrom}>{formatDateRange(trip.dateFrom, trip.dateTo)}</time>
      <span className={styles.tripMain}><strong>{trip.title}</strong>{trip.description ? <span>{trip.description}</span> : null}</span>
      <span className={styles.tripMeta}>{locationLabel(trip)}<br />{formatPrice(trip)}</span>
    </a>
  )
}

function CalendarTrip({ trip, featured }: { trip: CatalogueResult; featured: boolean }) {
  const category = trip.categories[0]?.label || 'Rockbusters trip'
  const metadata = [locationLabel(trip), `${formatDateRange(trip.dateFrom, trip.dateTo)} · ${tripDuration(trip)}`]

  return (
    <a className={[styles.calendarTrip, featured ? styles.calendarTripFeatured : ''].filter(Boolean).join(' ')} href={trip.href}>
      <span className={styles.cardMedia} aria-hidden="true">
        {trip.image ? <Image src={trip.image.url} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" /> : null}
      </span>
      <span className={styles.cardOverlay} aria-hidden="true" />
      <span className={styles.cardTop}>
        <span className={styles.cardBadge}>{category}</span>
        <span className={styles.cardMetaLine}>{metadata.join(' · ')}</span>
      </span>
      <span className={styles.cardContent}>
        <strong>{trip.title}</strong>
        {trip.description ? <span className={styles.cardDescription}>{trip.description}</span> : null}
        <span className={styles.cardFooter}><span>{formatPrice(trip)}</span><span>View trip details <span aria-hidden="true">-&gt;</span></span></span>
      </span>
    </a>
  )
}

function formatDateRange(from: string, to: string) {
  const format = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `${format.format(new Date(from))} - ${format.format(new Date(to))}`
}

function locationLabel(trip: CatalogueResult) {
  return trip.locations.map((location) => location.label).join(', ') || 'Destination'
}

function formatPrice(trip: CatalogueResult) {
  return `${trip.currency} ${trip.price.toLocaleString()}`
}

function tripDuration(trip: CatalogueResult) {
  const milliseconds = new Date(trip.dateTo).getTime() - new Date(trip.dateFrom).getTime()
  const days = Math.max(1, Math.round(milliseconds / 86_400_000))
  return `${days} ${days === 1 ? 'day' : 'days'}`
}
