import type { Event, EventDate, Guide, Location } from '@/payload-types'
import { applyTripEditorial, resolveTripEditorial, type TripEditorial } from './trip-editorial'
import { isUpcomingEventDate } from './event-date-visibility'

type Sections = NonNullable<NonNullable<Event['tripDetail']>['sections']>
type RichText = NonNullable<Event['content']>

export interface TripDetailView {
  event: Event
  editorial?: TripEditorial
  dates: EventDate[]
  selectedDate: EventDate | null
  guides: Guide[]
  locations: Location[]
  facts: { label: string; value: string }[]
  priceLabel: string | null
  dateLabel: string | null
  dateSpanLabel: string | null
  bookingHref: string | null
  availabilityLabel: string | null
  accommodation: Event['accommodation']
  transport: Event['transport']
  logisticsOverrides: EventDate['logisticsOverrides']
  sections: Sections
  remainingContent: Event['content'] | null
  remainingAdditionalInfo: Event['additionalInfo']
}

function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  if (Array.isArray(node)) return node.map(nodeText).join('')
  const value = node as Record<string, unknown>
  if (value.type === 'linebreak') return '\n'
  return typeof value.text === 'string' ? value.text : nodeText(value.children ?? value.root)
}

function meaningful(value: RichText | null | undefined): value is RichText {
  return !!value && (nodeText(value).trim().length > 0 || value.root.children.some(node => ['upload', 'block'].includes(node.type)))
}

// These are explicit source headings already recognized by the content migration.
// Matching chooses a rendering slot only; it never changes the heading or body.
const sourceHeadings: Record<Sections[number]['kind'], string[]> = {
  overview: ['course overview', 'trip overview', 'overview', 'about this course', 'about this trip'],
  learning: ['what you ll learn', 'what you will learn', 'what you learn', 'learning outcomes'],
  itinerary: ['itinerary', 'daily schedule', 'daily structure', 'programme', 'program', 'schedule'],
  requirements: ['requirements', 'prerequisites', 'physical technical requirements', 'physical and technical requirements'],
  equipment: ['what to bring', 'equipment', 'gear', 'essential equipment', 'kit list'],
  audience: ['who is it for', 'who this course is for', 'who this trip is for'],
  highlights: ['highlights', 'trip highlights', 'course highlights'],
  notes: ['need to know'],
}

function sourceKind(heading: string): Sections[number]['kind'] | undefined {
  const key = heading.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim()
  return (Object.keys(sourceHeadings) as Sections[number]['kind'][]).find(kind => sourceHeadings[kind].includes(key))
}

/** Runtime presentation of original source; this does not approve or backfill disputed copy. */
export function resolveTripSections(event: Event): Sections {
  const stored = (event.tripDetail?.sections ?? []).filter(section => meaningful(section.body))
  const occupied = new Set((event.tripDetail?.sections ?? []).map(section => section.kind))
  if (event.audienceCards?.length) occupied.add('audience')
  if (event.highlights?.length) occupied.add('highlights')
  if (event.prerequisites?.length) occupied.add('requirements')
  if (event.essentialEquipment?.length) occupied.add('equipment')
  if (event.whatYouLearn?.box1Heading || event.whatYouLearn?.box2Heading || event.whatYouLearn?.box3Heading) occupied.add('learning')
  if (event.itinerary?.days?.length) occupied.add('itinerary')
  const derived: Sections = []
  const add = (heading: string, body: RichText, id: string) => {
    const kind = sourceKind(heading)
    if (!kind || occupied.has(kind) || !meaningful(body)) return
    // Separate same-topic source passages remain separate; do not choose a winner.
    if (!derived.some(section => section.kind === kind && section.heading === heading && exact(section.body, body))) {
      derived.push({ kind, heading, body, id })
    }
  }
  const content = event.content
  if (content) {
    const nodes = content.root.children
    const boundaries = nodes.map((node, index) => ({ node, index })).filter(({ node }) =>
      nodeText(node).trim() && (node.type === 'heading' || (node.type === 'paragraph' && sourceKind(nodeText(node)))))
    boundaries.forEach(({ node, index }, position) => {
      const heading = nodeText(node)
      if (!sourceKind(heading)) return
      const children = nodes.slice(index + 1, boundaries[position + 1]?.index ?? nodes.length)
      add(heading, { ...content, root: { ...content.root, children } }, `source-content-${index}`)
    })
  }
  event.additionalInfo?.forEach((info, index) => {
    if (info.body) add(info.heading, info.body, `source-additional-${info.id ?? index}`)
  })
  return [...stored, ...derived]
}

// Ignore object key order only. Wording, node order, links and formatting must match.
function exact(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => exact(item, right[index]))
  }
  const a = left as Record<string, unknown>
  const b = right as Record<string, unknown>
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && exact(a[key], b[key]))
}

export function remainingTripContent(content: Event['content'], sections: Sections): Event['content'] | null {
  if (!content) return null
  const nodes = content.root.children
  const removed = new Set<number>()
  for (const section of sections) {
    const body = section.body.root.children
    if (!body.length) continue
    // Require the original heading followed by the complete exact body slice.
    // Edited source or edited target stays visible for editorial reconciliation.
    const start = nodes.findIndex((node, index) =>
      !removed.has(index) && ['heading', 'paragraph'].includes(node.type) &&
      nodeText(node) === section.heading && body.every((part, offset) =>
        !removed.has(index + offset + 1) && exact(part, nodes[index + offset + 1])),
    )
    if (start >= 0) for (let index = start; index <= start + body.length; index++) removed.add(index)
  }
  if (!removed.size) return content
  const children = nodes.filter((_, index) => !removed.has(index))
  return children.length ? { ...content, root: { ...content.root, children } } : null
}

export function remainingTripAdditionalInfo(event: Event, sections: Sections): Event['additionalInfo'] {
  return (event.additionalInfo ?? []).filter(info => !sections.some(section =>
    section.heading === info.heading && exact(section.body, info.body)))
}

function populated<T extends { id: number }>(values: (number | T)[] | null | undefined): T[] {
  return (values ?? []).filter((value): value is T => typeof value === 'object' && value !== null)
}

function unavailable(date: EventDate): boolean {
  return date.capacity <= 0 || (date.remainingSeats != null && date.remainingSeats <= 0)
}

export function resolveTripDetail(event: Event, dates: EventDate[], selectedId?: number): TripDetailView {
  const upcoming = dates.filter(date => date.active === true &&
    (typeof date.event === 'object' ? date.event.id : date.event) === event.id && isUpcomingEventDate(date) &&
    Number.isFinite(Date.parse(date.dateTo)) && Date.parse(date.dateTo) >= Date.parse(date.dateFrom))
    .sort((a, b) => Date.parse(a.dateFrom) - Date.parse(b.dateFrom) || a.id - b.id)
  const selectedDate = upcoming.find(date => date.id === selectedId) ??
    upcoming.find(date => !unavailable(date)) ?? upcoming[0] ?? null
  const editorial = resolveTripEditorial(event.editorial, selectedDate?.editorial)
  event = applyTripEditorial(event, selectedDate)
  const guides = populated(selectedDate?.guides?.length ? selectedDate.guides : event.coaches)
  const locations = populated(selectedDate?.locations?.length ? selectedDate.locations : event.locations)
  const seats = selectedDate?.remainingSeats
  const soldOut = selectedDate ? unavailable(selectedDate) : false
  const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const dateLabel = selectedDate ? formatter.formatRange(new Date(selectedDate.dateFrom), new Date(selectedDate.dateTo)) : null
  const calendarDays = selectedDate ? Math.round((Date.parse(selectedDate.dateTo.slice(0, 10)) - Date.parse(selectedDate.dateFrom.slice(0, 10))) / 86_400_000) + 1 : 0
  const dateSpanLabel = calendarDays > 0 ? `${calendarDays} calendar ${calendarDays === 1 ? 'day' : 'days'}` : null
  const priceLabel = selectedDate ? new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: selectedDate.currency, maximumFractionDigits: 2,
  }).format(selectedDate.price) : null
  const availabilityLabel = soldOut ? 'Sold out' : seats == null ? null : `${seats} ${seats === 1 ? 'spot' : 'spots'} available`
  const overrides = selectedDate?.logisticsOverrides
  const logisticsOverrides: NonNullable<EventDate['logisticsOverrides']> = {}
  for (const key of ['accommodation', 'food', 'included', 'excluded', 'note'] as const) {
    if (meaningful(overrides?.[key])) logisticsOverrides[key] = overrides[key]
  }
  const accommodation = {
    ...event.accommodation,
    description: logisticsOverrides.accommodation ?? event.accommodation?.description,
    cuisineHighlights: logisticsOverrides.food ?? event.accommodation?.cuisineHighlights,
    included: logisticsOverrides.included ? null : event.accommodation?.included,
    notIncluded: logisticsOverrides.excluded ? null : event.accommodation?.notIncluded,
  }
  const dateAirports = [selectedDate?.airportFrom, selectedDate?.airportTo]
    .filter(airport => typeof airport === 'object' && airport !== null)
    .filter((airport, index, airports) => airports.findIndex(item => item.id === airport.id) === index)
  const transport = dateAirports.length ? { ...event.transport, airports: dateAirports } : event.transport
  const sections = resolveTripSections(event)
  const facts: TripDetailView['facts'] = []
  if (dateLabel) facts.push({ label: 'Dates', value: dateLabel })
  if (locations.length) facts.push({ label: 'Location', value: locations.map(location => location.name).join(', ') })
  const difficulties = populated(event.difficulties)
  if (difficulties.length) facts.push({ label: 'Difficulty', value: difficulties.map(difficulty => difficulty.name).join(', ') })
  if (selectedDate?.capacity && selectedDate.capacity > 0) facts.push({ label: 'Group size', value: `Maximum ${selectedDate.capacity}` })
  if (guides.length) facts.push({ label: 'Guides', value: guides.map(guide => guide.name).join(', ') })
  return {
    event, editorial, dates: upcoming, selectedDate, guides, locations, facts, priceLabel, dateLabel, dateSpanLabel,
    bookingHref: selectedDate && !soldOut ? `/book/${selectedDate.id}` : null,
    availabilityLabel, accommodation, transport, logisticsOverrides, sections,
    remainingContent: remainingTripContent(event.content, sections),
    remainingAdditionalInfo: remainingTripAdditionalInfo(event, sections),
  }
}
