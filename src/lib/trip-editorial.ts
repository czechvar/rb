import type { Event, Guide } from '@/payload-types'
import { editorialContentKeys, type tripSectionKeys } from '@/fields/tripEditorial'

export type TripSectionKey = (typeof tripSectionKeys)[number]
export type HeadingPart = {
  text: string
  accent?: boolean | null
  breakBefore?: boolean | null
  id?: string | null
}
export type SectionCopy = {
  eyebrow?: string | null
  heading?: string | null
  headingParts?: HeadingPart[] | null
  intro?: string | null
  visibility?: 'inherit' | 'show' | 'hide' | null
  hide?: boolean | null
  clearEyebrow?: boolean | null
  clearHeading?: boolean | null
  clearIntro?: boolean | null
}
export type TripEditorial = {
  sections?: (SectionCopy & { key: TripSectionKey })[] | null
  hero?: {
    titleParts?: HeadingPart[] | null
    description?: string | null
    hashtag?: string | null
    primaryLabel?: string | null
    secondaryLabel?: string | null
    secondaryTarget?: 'programme' | 'dates' | null
    clearHashtag?: boolean | null
  } | null
  dailySchedule?:
    | { time?: string | null; title?: string | null; description?: string | null }[]
    | null
  overviewFacts?: EditorialFact[] | null
  venue?: { paragraphs?: { text?: string | null }[] | null; facts?: EditorialFact[] | null } | null
  practicalCards?: { heading?: string | null; body?: string | null }[] | null
  packageItems?: { text?: string | null }[] | null
  packageNote?: string | null
  booking?: {
    primaryLabel?: string | null
    secondaryLabel?: string | null
    support?: string | null
  } | null
  faqs?: { question?: string | null; answer?: string | null }[] | null
  previewReviews?: { name?: string | null; quote?: string | null; context?: string | null }[] | null
  coachProfiles?:
    | { guide?: number | Guide | null; role?: string | null; bio?: string | null }[]
    | null
  clearContentFields?:
    | (Exclude<(typeof editorialContentKeys)[number], 'title'> | 'tripDetail.sections')[]
    | null
  content?: { [Key in (typeof editorialContentKeys)[number]]?: Event[Key] | null } | null
}
export type EditorialFact = {
  label?: string | null
  value?: string | null
  description?: string | null
}
export type EditorialOwner = { editorial?: TripEditorial | null }

const supplied = (value: unknown): boolean =>
  value !== undefined &&
  value !== null &&
  value !== '' &&
  (!Array.isArray(value) || value.length > 0)

/** Arrays replace as a unit; Payload's empty/null optional values inherit. */
function merge<T>(base: T, override: unknown): T {
  if (!supplied(override)) return base
  if (typeof override !== 'object' || Array.isArray(override)) return override as T
  const result: Record<string, unknown> = { ...((base as Record<string, unknown>) ?? {}) }
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (key === 'id' || !supplied(value)) continue
    result[key] = merge(result[key], value)
  }
  return result as T
}

function mergeSection(base: SectionCopy, override: SectionCopy): SectionCopy {
  const result = merge(base, override)
  if (override.visibility === 'show') result.hide = false
  else if (override.visibility === 'hide' || override.hide === true) result.hide = true
  else result.hide = base.hide ?? (base.visibility === 'hide' ? true : undefined)
  if (override.visibility === 'inherit' || !override.visibility) result.visibility = base.visibility
  if (supplied(override.headingParts)) result.heading = undefined
  else if (supplied(override.heading)) result.headingParts = undefined
  for (const field of ['eyebrow', 'heading', 'intro'] as const) {
    const flag = `clear${field[0].toUpperCase()}${field.slice(1)}` as
      | 'clearEyebrow'
      | 'clearHeading'
      | 'clearIntro'
    if (override[flag]) {
      result[field] = ''
      if (field === 'heading') result.headingParts = []
    } else if (
      supplied(override[field]) ||
      (field === 'heading' && supplied(override.headingParts))
    ) {
      result[flag] = false
    } else {
      result[flag] = base[flag]
    }
  }
  return result
}

export function resolveTripEditorial(
  event?: TripEditorial | null,
  occurrence?: TripEditorial | null,
): TripEditorial {
  const result = merge<TripEditorial>(merge<TripEditorial>({}, event), occurrence)
  const sections = new Map<TripSectionKey, SectionCopy & { key: TripSectionKey }>()
  for (const row of [...(event?.sections ?? []), ...(occurrence?.sections ?? [])]) {
    sections.set(row.key, { ...mergeSection(sections.get(row.key) ?? {}, row), key: row.key })
  }
  result.sections = [...sections.values()]
  // Explicit occurrence content can restore a field cleared on the parent.
  result.clearContentFields = result.clearContentFields?.filter((key) => {
    if (occurrence?.clearContentFields?.includes(key)) return true
    const replacement =
      key === 'tripDetail.sections'
        ? occurrence?.content?.tripDetail?.sections
        : occurrence?.content?.[key]
    return !supplied(replacement)
  })
  const clearHashtag =
    occurrence?.hero?.clearHashtag ||
    (!supplied(occurrence?.hero?.hashtag) && event?.hero?.clearHashtag)
  if (result.hero)
    result.hero = {
      ...result.hero,
      clearHashtag: Boolean(clearHashtag),
      ...(clearHashtag ? { hashtag: '' } : {}),
    }
  return result
}

/** Explicit custom-block copy wins only for fields it actually supplies. */
export function resolveSectionCopy(
  key: TripSectionKey,
  editorial: TripEditorial | null | undefined,
  defaults: SectionCopy = {},
  explicit: SectionCopy = {},
): SectionCopy {
  const row = editorial?.sections?.find((section) => section.key === key)
  return mergeSection(mergeSection(defaults, row ?? {}), explicit)
}

/** A derived view only: no mutation, and no commercial/relationship override surface. */
export function applyTripEditorial<T extends Event>(
  event: T & EditorialOwner,
  occurrence?: EditorialOwner | null,
): T & { editorial: TripEditorial } {
  const editorial = resolveTripEditorial(event.editorial, occurrence?.editorial)
  const safeContent = Object.fromEntries(
    editorialContentKeys.map((key) => [key, editorial.content?.[key]]),
  )
  const result = merge(event, safeContent)
  for (const key of editorial.clearContentFields ?? []) {
    if (key === 'tripDetail.sections') {
      result.tripDetail = { ...result.tripDetail, sections: [] }
      continue
    }
    if (key !== ('title' as string) && editorialContentKeys.includes(key))
      Object.assign(result, { [key]: null })
  }
  // Editorial copy cannot author or clear venue/media relationships nested in legacy groups.
  if (event.transport?.airports)
    result.transport = { ...result.transport, airports: event.transport.airports }
  else if (result.transport)
    result.transport = { ...result.transport, airports: event.transport?.airports }
  if (result.itinerary?.days) {
    const sourceDays = event.itinerary?.days ?? []
    result.itinerary = {
      ...result.itinerary,
      days: result.itinerary.days.map((day) => {
        const byId = day.id ? sourceDays.find((source) => source.id === day.id) : undefined
        const byDestination = sourceDays.filter(
          (source) => source.destinationName === day.destinationName,
        )
        const source = byId ?? (byDestination.length === 1 ? byDestination[0] : undefined)
        return { ...day, image: source?.image }
      }),
    }
  }
  return { ...result, editorial }
}

export function headingText(parts?: HeadingPart[] | null): string {
  return (
    parts
      ?.map((part) => `${part.breakBefore ? '\n' : ''}${part.text}`)
      .join('')
      .replace(/^\n/, '') ?? ''
  )
}
