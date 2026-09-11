import type { TripDetailView } from './trip-detail'

/** Editorial labels belong to the Event; commercial facts follow the selected occurrence. */
export function tripSummary(view: TripDetailView) {
  const content = view.event.tripDetail
  const date = view.selectedDate
  if (!content?.locationDescriptor || !date) return null
  const from = new Date(date.dateFrom)
  const to = new Date(date.dateTo)
  const days = Math.round(
    (Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) -
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) /
      86400000,
  )
  const weeks = days > 0 && days % 7 === 0 ? days / 7 : null
  const unit = weeks ? `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}` : `${days} Days`
  const stamp = (value: Date) =>
    `${value.getUTCDate()} ${new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(value).replace('Sept', 'Sep')}`
  const dateRange = `${stamp(from)}${from.getUTCFullYear() !== to.getUTCFullYear() ? ` ${from.getUTCFullYear()}` : ''}–${stamp(to)}`
  const money = (price: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: date.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  const relationIds = (values: typeof date.locations) =>
    (values ?? [])
      .map((value) => (typeof value === 'object' ? value.id : value))
      .sort()
      .join(',')
  const weekly =
    weeks && weeks > 1
      ? view.dates.find(
          (candidate) =>
            candidate.id !== date.id &&
            candidate.currency === date.currency &&
            candidate.dateFrom === date.dateFrom &&
            relationIds(candidate.locations) === relationIds(date.locations) &&
            Date.parse(candidate.dateTo) - Date.parse(candidate.dateFrom) === 7 * 86400000,
        )
      : undefined
  const location = view.locations
    .map((value) => [value.name, value.country].filter(Boolean).join(', '))
    .join(' · ')
  const coaches = view.guides.map((value) => value.name).join(' & ')
  return {
    price: money(date.price),
    weeklyPrice: weekly ? money(weekly.price) : null,
    durationDays: days,
    primaryPrice: `${money(date.price)} / ${unit.toLowerCase()}`,
    secondaryPrice: weekly ? `Or ${money(weekly.price)} per week individually` : undefined,
    caption: content.priceCaption ?? 'per person',
    callout: view.bookingHref
      ? (content.travelNote ?? view.availabilityLabel ?? undefined)
      : (view.availabilityLabel ?? undefined),
    rows: [
      { label: 'Dates', value: `${dateRange} ${to.getUTCFullYear()}` },
      { label: 'Duration', value: weeks ? `${days} Days (${unit})` : unit },
      ...(location ? [{ label: 'Location', value: location }] : []),
      ...(content.leadRequirement ? [{ label: 'Level', value: content.leadRequirement }] : []),
      ...(coaches ? [{ label: 'Coaches', value: coaches }] : []),
    ],
    strip: [
      {
        label: content.locationDescriptor,
        value: view.locations.map((value) => value.name).join(', '),
      },
      { label: `${days} Days`, value: dateRange },
      ...(content.gradeRange ? [{ label: 'Grade', value: content.gradeRange }] : []),
      ...(content.minimumParticipants
        ? [{ label: 'Min. Participants', value: String(content.minimumParticipants) }]
        : []),
      { label: `Price (${unit})`, value: money(date.price) },
    ],
  }
}

/** Only explicit CMS placeholders are interpolated; prose is never parsed for prices. */
export function tripCommercialText(
  view: TripDetailView,
  text: string | null | undefined,
): string | undefined {
  if (text == null) return undefined
  const summary = tripSummary(view)
  const values: Record<string, string> = {
    price: summary?.price ?? view.priceLabel ?? 'Enquire',
    weeklyPrice: summary?.weeklyPrice ?? 'Enquire',
    durationDays: summary ? String(summary.durationDays) : '',
    capacity: view.selectedDate ? String(view.selectedDate.capacity) : 'Enquire',
    location: view.locations.map((location) => location.name).join(', '),
    coaches: view.guides.map((guide) => guide.name).join(' & '),
  }
  return text.replace(
    /\{(price|weeklyPrice|durationDays|capacity|location|coaches)\}/g,
    (_, key: string) => values[key],
  )
}
