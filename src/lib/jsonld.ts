import type { Event, EventDate, Faq, Guide, Location, Media, Page, Post, Program } from '@/payload-types'
import { mediaUrl as payloadMediaUrl } from '@/lib/media'
import {
  resolveFeaturedGuide,
  resolveFeaturedLocation,
  resolveFeaturedProgram,
  resolveGuideGridGuides,
  resolveLocationGridLocations,
  resolveProgramGridPrograms,
} from '@/lib/block-resolvers/domain-grids'
import {
  resolveCalendarEventDates,
  resolveFeaturedEventDate,
  resolveFeaturedPost,
  resolvePostGridPosts,
} from '@/lib/block-resolvers/content-discovery'
import { resolveFeaturedTrip, resolveTripGridEvents } from '@/lib/block-resolvers/trip-grid'

type JsonPrimitive = string | number | boolean
export type JsonLdValue = JsonPrimitive | JsonLdObject | JsonLdValue[] | null | undefined
export type JsonLdObject = { [key: string]: JsonLdValue }

type Maybe<T> = T | number | string | null | undefined
type BreadcrumbItem = { name: string; path: string }
type ListItemInput = { name: string; url: string }
type JsonLdGraph = JsonLdObject & { '@graph': JsonLdObject[] }
type CmsPageSchemaType = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'FAQPage'

const DEFAULT_STRUCTURED_DATA_SITE_URL = 'https://rockbusters.net'
const DEFAULT_BUSINESS_NAME = 'Rockbusters'
const IN_STOCK = 'https://schema.org/InStock'
const SOLD_OUT = 'https://schema.org/SoldOut'
const CMS_PAGE_SCHEMA_TYPES = new Set<CmsPageSchemaType>([
  'WebPage',
  'AboutPage',
  'ContactPage',
  'CollectionPage',
  'FAQPage',
])

export function absoluteUrl(pathOrUrl = ''): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return structuredDataSiteUrl(pathOrUrl)
}

export function businessName(): string {
  return text(process.env.STRUCTURED_DATA_BUSINESS_NAME) ?? DEFAULT_BUSINESS_NAME
}

export function structuredDataSiteUrl(pathname = ''): string {
  const base =
    text(process.env.STRUCTURED_DATA_SITE_URL) ??
    text(process.env.NEXT_PUBLIC_SITE_URL) ??
    DEFAULT_STRUCTURED_DATA_SITE_URL
  const trimmed = base.replace(/\/+$/, '')
  if (!pathname) return trimmed
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${trimmed}${path}`
}

export function absoluteMediaUrl(media: Maybe<Media>): string | undefined {
  if (!isDoc(media)) return undefined
  const url = payloadMediaUrl(media)
  if (!url) return undefined
  return absoluteUrl(url)
}

export function cleanJsonLd<T>(value: T): T {
  return prune(value) as T
}

export function organizationJsonLd() {
  return cleanJsonLd({
    '@type': 'Organization',
    '@id': absoluteUrl('/#organization'),
    name: businessName(),
    url: absoluteUrl('/'),
  })
}

export function websiteJsonLd() {
  return cleanJsonLd({
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: businessName(),
    url: absoluteUrl('/'),
    publisher: { '@id': absoluteUrl('/#organization') },
    inLanguage: 'en',
  })
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return cleanJsonLd({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  })
}

export function webPageJsonLd(input: {
  url: string
  name: string
  description?: string | null
  mainEntity?: JsonLdObject | JsonLdObject[]
  image?: string
  type?: string
}) {
  return cleanJsonLd({
    '@type': input.type ?? 'WebPage',
    '@id': `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: text(input.description),
    isPartOf: { '@id': absoluteUrl('/#organization') },
    mainEntity: input.mainEntity,
    primaryImageOfPage: input.image,
  })
}

export async function genericCmsPageGraphJsonLd(page: Page, path = `/cms-pages/${page.slug}`) {
  const url = absoluteUrl(path)
  const visibleCatalogue = await visibleCatalogueFromPageLayout(page.layout)
  const visibleItemList = visibleCatalogue.items.length
    ? itemListJsonLd({
        id: `${url}#visible-catalogue`,
        name: `${page.title} visible catalogue`,
        items: visibleCatalogue.items,
      })
    : undefined

  return graph([
    organizationJsonLd(),
    webPageJsonLd({
      url,
      name: page.seo?.title ?? page.title,
      description: descriptionFor(page),
      image: firstLayoutImage(page),
      type: cmsPageSchemaType(page.structuredData?.schemaType),
      mainEntity: visibleItemList ? { '@id': visibleItemList['@id'] } : undefined,
    }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: page.title, path },
    ]),
    ...(visibleItemList ? [visibleItemList] : []),
    ...visibleCatalogue.nodes,
  ])
}

export async function homepageGraphJsonLd(input: {
  page?: Page | null
  heroMedia?: Maybe<Media>
  featuredEvents?: Event[]
}) {
  const url = absoluteUrl('/')
  const visibleCatalogue = input.page?.layout?.length
    ? await visibleCatalogueFromPageLayout(input.page.layout)
    : { items: eventListItems(input.featuredEvents ?? []), nodes: [] }
  const featuredList = visibleCatalogue.items.length
    ? itemListJsonLd({
        id: `${url}#visible-catalogue`,
        name: 'Visible Rockbusters catalogue',
        items: visibleCatalogue.items,
      })
    : undefined

  return graph([
    organizationJsonLd(),
    websiteJsonLd(),
    webPageJsonLd({
      url,
      name: input.page?.seo?.title ?? input.page?.title ?? businessName(),
      description: descriptionFor(input.page) ?? `Climbing trips, coaching weeks, and guided climbing experiences by ${businessName()}.`,
      mainEntity: featuredList ? { '@id': featuredList['@id'] } : undefined,
      image: absoluteMediaUrl(input.heroMedia) ?? firstLayoutImage(input.page),
    }),
    ...(featuredList ? [featuredList] : []),
    ...visibleCatalogue.nodes,
  ])
}

export function locationPlaceJsonLd(location: Location, path = `/destinations/${location.slug}`) {
  const url = absoluteUrl(path)
  const image = mediaUrls([location.mainPicture, ...(location.gallery ?? [])])
  const address = [location.address, location.city, location.country].some(Boolean)
    ? {
        '@type': 'PostalAddress',
        streetAddress: location.address,
        addressLocality: location.city,
        addressCountry: location.country,
      }
    : undefined

  return cleanJsonLd({
    '@type': 'Place',
    '@id': `${url}#place`,
    additionalType: 'https://schema.org/TouristDestination',
    name: location.name,
    url,
    description: descriptionFor(location),
    image,
    address,
    geo: location.coordinates
      ? {
          '@type': 'GeoCoordinates',
          longitude: location.coordinates[0],
          latitude: location.coordinates[1],
        }
      : undefined,
  })
}

export function guidePersonJsonLd(guide: Guide, path = `/team/${guide.slug}`) {
  const url = absoluteUrl(path)
  return cleanJsonLd({
    '@type': 'Person',
    '@id': `${url}#person`,
    name: guide.name,
    url,
    jobTitle: guide.role,
    description: descriptionFor(guide),
    image: absoluteMediaUrl(guide.photo),
    worksFor: { '@id': absoluteUrl('/#organization') },
    affiliation: { '@id': absoluteUrl('/#organization') },
    knowsAbout: guide.tags?.map((tag) => tag.text),
    subjectOf: { '@id': `${url}#trips` },
  })
}

export function programCourseJsonLd(program: Program, path = `/programs/${program.slug}`) {
  const url = absoluteUrl(path)
  return cleanJsonLd({
    '@type': 'Course',
    '@id': `${url}#program`,
    name: program.name,
    url,
    description: descriptionFor(program),
    image: mediaUrls([program.mainPicture, ...(program.gallery ?? [])]),
    provider: { '@id': absoluteUrl('/#organization') },
    teaches: [
      ...(program.curriculumPillars?.map((pillar) => pillar.title) ?? []),
      ...(program.results?.map((result) => result.text) ?? []),
    ],
  })
}

export function eventTripJsonLd(event: Event, eventDates: EventDate[], path = `/trips/${event.slug}`) {
  const url = absoluteUrl(path)
  const locations = docs(event.locations).map((location) => locationPlaceJsonLd(location))
  const guides = docs(event.coaches).map((guide) => guidePersonJsonLd(guide))
  const structuredDates = structuredDataEventDates(eventDates)
  const offers = structuredDates.map((date) => eventDateOfferJsonLd(event, date, url))
  const dateEvents = structuredDates.map((date) => eventDateJsonLd(event, date, url))

  return cleanJsonLd({
    '@type': ['TouristTrip', 'Product'],
    '@id': `${url}#trip`,
    name: event.title,
    url,
    description: descriptionFor(event),
    image: mediaUrls([event.mainPicture, ...(event.gallery ?? [])]),
    brand: { '@id': absoluteUrl('/#organization') },
    category: docs(event.programs).map((program) => program.name),
    itinerary: event.itinerary?.days?.map((day) => ({
      '@type': 'TouristAttraction',
      name: day.destinationName,
      description: day.description,
    })),
    location: locations.map((location) => ({ '@id': location['@id'] })),
    provider: guides.map((guide) => ({ '@id': guide['@id'] })),
    offers,
    event: dateEvents.map((dateEvent) => ({ '@id': dateEvent['@id'] })),
  })
}

export function eventDateJsonLd(event: Event, date: EventDate, tripUrl = absoluteUrl(`/trips/${event.slug}`)) {
  const id = eventDateId(tripUrl, date)
  const locations = docs(date.locations).length > 0 ? docs(date.locations) : docs(event.locations)
  const guides = docs(date.guides).length > 0 ? docs(date.guides) : docs(event.coaches)

  return cleanJsonLd({
    '@type': 'Event',
    '@id': id,
    name: `${event.title} (${date.dateFrom} - ${date.dateTo})`,
    url: `${tripUrl}#dates`,
    startDate: date.dateFrom,
    endDate: date.dateTo,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: { '@id': absoluteUrl('/#organization') },
    location: locations.map((location) => ({ '@id': locationPlaceJsonLd(location)['@id'] })),
    performer: guides.map((guide) => ({ '@id': guidePersonJsonLd(guide)['@id'] })),
    offers: eventDateOfferJsonLd(event, date, tripUrl),
  })
}

export function eventDateOfferJsonLd(event: Event, date: EventDate, tripUrl = absoluteUrl(`/trips/${event.slug}`)) {
  return cleanJsonLd({
    '@type': 'Offer',
    '@id': `${eventDateId(tripUrl, date)}-offer`,
    url: absoluteUrl(`/book/${date.id}`),
    price: date.price,
    priceCurrency: date.currency,
    availability: availabilityFor(date),
    itemOffered: { '@id': eventDateId(tripUrl, date) },
  })
}

export function eventDetailGraphJsonLd(event: Event) {
  const url = absoluteUrl(`/trips/${event.slug}`)
  const trip = eventTripJsonLd(event, [], `/trips/${event.slug}`)
  const locations = docs(event.locations).map((location) => locationPlaceJsonLd(location))
  const guides = docs(event.coaches).map((guide) => guidePersonJsonLd(guide))

  return graph([
    organizationJsonLd(),
    webPageJsonLd({ url, name: event.seo?.title ?? event.title, description: descriptionFor(event), mainEntity: { '@id': trip['@id'] }, image: absoluteMediaUrl(event.mainPicture) }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Trips', path: '/trips' },
      { name: event.title, path: `/trips/${event.slug}` },
    ]),
    ...locations,
    ...guides,
    trip,
  ])
}

export function eventDatesGraphJsonLd(event: Event, eventDates: EventDate[]) {
  const url = absoluteUrl(`/trips/${event.slug}/dates`)
  const tripUrl = absoluteUrl(`/trips/${event.slug}`)
  const structuredDates = structuredDataEventDates(eventDates)
  const trip = eventTripJsonLd(event, structuredDates, `/trips/${event.slug}`)
  const locations = [
    ...docs(event.locations),
    ...structuredDates.flatMap((date) => docs(date.locations)),
  ]
  const guides = [
    ...docs(event.coaches),
    ...structuredDates.flatMap((date) => docs(date.guides)),
  ]

  return graph([
    organizationJsonLd(),
    webPageJsonLd({ url, name: `${event.title} Dates`, description: descriptionFor(event), mainEntity: { '@id': trip['@id'] }, image: absoluteMediaUrl(event.mainPicture) }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Calendar', path: '/calendar' },
      { name: event.title, path: `/trips/${event.slug}` },
      { name: 'Dates', path: `/trips/${event.slug}/dates` },
    ]),
    ...uniqueById(locations.map((location) => locationPlaceJsonLd(location))),
    ...uniqueById(guides.map((guide) => guidePersonJsonLd(guide))),
    ...structuredDates.map((date) => eventDateJsonLd(event, date, tripUrl)),
    trip,
  ])
}

export function tripFaqGraphJsonLd(event: Event, faqs: Faq[] = []) {
  const url = absoluteUrl(`/trips/${event.slug}/faq`)
  const faqPage = cleanJsonLd({
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    name: `${event.title} FAQ`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: richTextPlainText(faq.answer),
      },
    })),
    isPartOf: { '@id': `${absoluteUrl(`/trips/${event.slug}`)}#trip` },
  })

  return graph([
    organizationJsonLd(),
    webPageJsonLd({
      url,
      name: `${event.title} FAQ`,
      description: descriptionFor(event),
      mainEntity: { '@id': faqPage['@id'] },
      image: absoluteMediaUrl(event.mainPicture),
    }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Calendar', path: '/calendar' },
      { name: event.title, path: `/trips/${event.slug}` },
      { name: 'FAQ', path: `/trips/${event.slug}/faq` },
    ]),
    faqPage,
  ])
}

export function tripLogisticsGraphJsonLd(event: Event) {
  const url = absoluteUrl(`/trips/${event.slug}/logistics`)
  const trip = eventTripJsonLd(event, [], `/trips/${event.slug}`)
  const locations = docs(event.locations).map((location) => locationPlaceJsonLd(location))
  const guides = docs(event.coaches).map((guide) => guidePersonJsonLd(guide))

  return graph([
    organizationJsonLd(),
    webPageJsonLd({
      url,
      name: `${event.title} Logistics`,
      description: descriptionFor(event),
      mainEntity: { '@id': trip['@id'] },
      image: absoluteMediaUrl(event.mainPicture),
    }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Calendar', path: '/calendar' },
      { name: event.title, path: `/trips/${event.slug}` },
      { name: 'Logistics', path: `/trips/${event.slug}/logistics` },
    ]),
    ...locations,
    ...guides,
    trip,
  ])
}

export function programDetailGraphJsonLd(program: Program, events: Event[] = []) {
  const url = absoluteUrl(`/programs/${program.slug}`)
  const course = programCourseJsonLd(program)
  const eventList = itemListJsonLd({
    id: `${url}#trips`,
    name: `Trips for ${program.name}`,
    items: events.map((event) => ({
      name: event.title,
      url: absoluteUrl(`/trips/${event.slug}`),
    })),
  })

  return graph([
    organizationJsonLd(),
    webPageJsonLd({ url, name: program.seo?.title ?? program.name, description: descriptionFor(program), mainEntity: { '@id': course['@id'] }, image: absoluteMediaUrl(program.mainPicture) }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Programs', path: '/programs' },
      { name: program.name, path: `/programs/${program.slug}` },
    ]),
    course,
    eventList,
  ])
}

export function itemListJsonLd(input: {
  id: string
  name: string
  items: ListItemInput[]
}) {
  return cleanJsonLd({
    '@type': 'ItemList',
    '@id': input.id,
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  })
}

export function collectionPageGraphJsonLd(input: {
  path: string
  name: string
  description?: string | null
  items: ListItemInput[]
  breadcrumbs?: BreadcrumbItem[]
}) {
  const url = absoluteUrl(input.path)
  const itemList = itemListJsonLd({
    id: `${url}#item-list`,
    name: input.name,
    items: input.items,
  })

  return graph([
    organizationJsonLd(),
    webPageJsonLd({
      url,
      name: input.name,
      description: input.description,
      type: 'CollectionPage',
      mainEntity: input.items.length ? { '@id': itemList['@id'] } : undefined,
    }),
    breadcrumbListJsonLd(input.breadcrumbs ?? [
      { name: 'Home', path: '/' },
      { name: input.name, path: input.path },
    ]),
    ...(input.items.length ? [itemList] : []),
  ])
}

export function tripListItems(events: Event[]) {
  return eventListItems(events)
}

export function locationListItems(locations: Location[]) {
  return locations.map((location) => ({
    name: location.name,
    url: absoluteUrl(`/destinations/${location.slug}`),
  }))
}

export function guideListItems(guides: Guide[]) {
  return guides.map((guide) => ({
    name: guide.name,
    url: absoluteUrl(`/team/${guide.slug}`),
  }))
}

export function postListItems(posts: Post[]) {
  return posts.map((post) => ({
    name: post.title,
    url: absoluteUrl(`/blog/${post.slug}`),
  }))
}

export function blogPostGraphJsonLd(post: Post) {
  const url = absoluteUrl(`/blog/${post.slug}`)
  const article = cleanJsonLd({
    '@type': 'BlogPosting',
    '@id': `${url}#blogposting`,
    headline: post.title,
    name: post.title,
    url,
    description: descriptionFor(post),
    image: absoluteMediaUrl(post.heroImage),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author,
        }
      : { '@id': absoluteUrl('/#organization') },
    publisher: { '@id': absoluteUrl('/#organization') },
    mainEntityOfPage: { '@id': `${url}#webpage` },
  })

  return graph([
    organizationJsonLd(),
    webPageJsonLd({
      url,
      name: post.seo?.title ?? post.title,
      description: descriptionFor(post),
      mainEntity: { '@id': article['@id'] },
      image: absoluteMediaUrl(post.heroImage),
    }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    article,
  ])
}

export function calendarGraphJsonLd(eventDates: EventDate[]) {
  const url = absoluteUrl('/calendar')
  const structuredDates = structuredDataEventDates(eventDates)
  const dateEvents = structuredDates.map(calendarEventDateJsonLd).filter(isJsonLdObject)
  const itemList = itemListJsonLd({
    id: `${url}#event-dates`,
    name: 'Upcoming Rockbusters dates',
    items: dateEvents.map((dateEvent) => ({
      name: String(dateEvent.name),
      url: String(dateEvent.url),
    })),
  })

  return graph([
    organizationJsonLd(),
    webPageJsonLd({
      url,
      name: 'Calendar',
      description: 'Every bookable date across every Rockbusters program, in order.',
      type: 'CollectionPage',
      mainEntity: structuredDates.length ? { '@id': itemList['@id'] } : undefined,
    }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Calendar', path: '/calendar' },
    ]),
    ...(structuredDates.length ? [itemList] : []),
    ...eventDateRelationNodes(structuredDates),
    ...dateEvents,
  ])
}

export function locationDetailGraphJsonLd(location: Location, events: Event[] = []) {
  const url = absoluteUrl(`/destinations/${location.slug}`)
  const place = locationPlaceJsonLd(location)
  const eventList = itemListJsonLd({
    id: `${url}#trips`,
    name: `Trips in ${location.name}`,
    items: events.map((event) => ({
      name: event.title,
      url: absoluteUrl(`/trips/${event.slug}`),
    })),
  })

  return graph([
    organizationJsonLd(),
    webPageJsonLd({ url, name: location.seo?.title ?? location.name, description: descriptionFor(location), mainEntity: { '@id': place['@id'] }, image: absoluteMediaUrl(location.mainPicture) }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Destinations', path: '/destinations' },
      { name: location.name, path: `/destinations/${location.slug}` },
    ]),
    place,
    eventList,
  ])
}

export function guideDetailGraphJsonLd(guide: Guide, events: Event[] = []) {
  const url = absoluteUrl(`/team/${guide.slug}`)
  const person = guidePersonJsonLd(guide)
  const eventList = itemListJsonLd({
    id: `${url}#trips`,
    name: `Trips with ${guide.name}`,
    items: events.map((event) => ({
      name: event.title,
      url: absoluteUrl(`/trips/${event.slug}`),
    })),
  })

  return graph([
    organizationJsonLd(),
    webPageJsonLd({ url, name: guide.seo?.title ?? guide.name, description: descriptionFor(guide), mainEntity: { '@id': person['@id'] }, image: absoluteMediaUrl(guide.photo), type: 'ProfilePage' }),
    breadcrumbListJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Team', path: '/team' },
      { name: guide.name, path: `/team/${guide.slug}` },
    ]),
    person,
    eventList,
  ])
}

export function descriptionFor(doc: Event | Program | Location | Guide | Post | Page | null | undefined): string | undefined {
  if (!doc) return undefined
  if ('seo' in doc) {
    const seoDescription = text(doc.seo?.description)
    if (seoDescription) return seoDescription
  }

  if ('shortDescription' in doc) {
    const shortDescription = text(doc.shortDescription)
    if (shortDescription) return shortDescription
  }

  if ('heroSub' in doc) {
    const heroSub = text(doc.heroSub)
    if (heroSub) return heroSub
  }

  if ('tagline' in doc) {
    const tagline = text(doc.tagline)
    if (tagline) return tagline
  }

  if ('content' in doc) return richTextPlainText(doc.content)
  return undefined
}

export function richTextPlainText(value: unknown): string | undefined {
  const parts: string[] = []
  collectText(value, parts)
  return text(parts.join(' '))
}

function graph(nodes: JsonLdObject[]): JsonLdGraph {
  return cleanJsonLd({
    '@context': 'https://schema.org',
    '@graph': nodes,
  })
}

function calendarEventDateJsonLd(date: EventDate): JsonLdObject | undefined {
  const event = isDoc(date.event) ? date.event : null
  if (!event) return undefined

  const tripUrl = absoluteUrl(`/trips/${event.slug}`)
  return eventDateJsonLd(event, date, tripUrl)
}

function structuredDataEventDates(eventDates: EventDate[]): EventDate[] {
  return eventDates.filter((date) => date.active !== false && !isPastEventDate(date))
}

function isPastEventDate(date: EventDate) {
  return new Date(date.dateTo).getTime() < Date.now()
}

function eventDateRelationNodes(eventDates: EventDate[]): JsonLdObject[] {
  const locations: Location[] = []
  const guides: Guide[] = []

  for (const date of eventDates) {
    const event = isDoc(date.event) ? date.event : null
    if (!event) continue
    const dateLocations = docs(date.locations)
    const dateGuides = docs(date.guides)
    locations.push(...(dateLocations.length ? dateLocations : docs(event.locations)))
    guides.push(...(dateGuides.length ? dateGuides : docs(event.coaches)))
  }

  return [
    ...uniqueById(locations.map((location) => locationPlaceJsonLd(location))),
    ...uniqueById(guides.map((guide) => guidePersonJsonLd(guide))),
  ]
}

function eventListItems(events: Event[]): ListItemInput[] {
  return events.map((event) => ({
    name: event.title,
    url: absoluteUrl(`/trips/${event.slug}`),
  }))
}

async function visibleCatalogueFromPageLayout(layout: Page['layout'] | null | undefined) {
  const items: ListItemInput[] = []
  const nodes: JsonLdObject[] = []

  for (const block of layout ?? []) {
    switch (block.blockType) {
      case 'tripGrid': {
        const events = await resolveTripGridEvents(block)
        items.push(...eventListItems(events))
        break
      }
      case 'featuredTrip': {
        const event = await resolveFeaturedTrip(block)
        if (event) items.push(...eventListItems([event]))
        break
      }
      case 'programGrid': {
        const programs = await resolveProgramGridPrograms(block)
        items.push(...programListItems(programs))
        break
      }
      case 'featuredProgram': {
        const program = await resolveFeaturedProgram(block)
        if (program) items.push(...programListItems([program]))
        break
      }
      case 'locationGrid': {
        const locations = await resolveLocationGridLocations(block)
        items.push(...locationListItems(locations))
        break
      }
      case 'featuredLocation': {
        const location = await resolveFeaturedLocation(block)
        if (location) items.push(...locationListItems([location]))
        break
      }
      case 'guideGrid': {
        const guides = await resolveGuideGridGuides(block)
        items.push(...guideListItems(guides))
        break
      }
      case 'featuredGuide': {
        const guide = await resolveFeaturedGuide(block)
        if (guide) items.push(...guideListItems([guide]))
        break
      }
      case 'postGrid': {
        const posts = await resolvePostGridPosts(block)
        items.push(...postListItems(posts))
        break
      }
      case 'featuredPost': {
        const post = await resolveFeaturedPost(block)
        if (post) items.push(...postListItems([post]))
        break
      }
      case 'calendar': {
        const dates = structuredDataEventDates(await resolveCalendarEventDates(block))
        const dateNodes = dates.map(calendarEventDateJsonLd).filter(isJsonLdObject)
        nodes.push(...eventDateRelationNodes(dates))
        nodes.push(...dateNodes)
        items.push(...dateNodes.map((dateEvent) => ({
          name: String(dateEvent.name),
          url: String(dateEvent.url),
        })))
        break
      }
      case 'featuredEventDate': {
        const date = await resolveFeaturedEventDate(block)
        const structuredDates = date ? structuredDataEventDates([date]) : []
        const dateNode = structuredDates[0] ? calendarEventDateJsonLd(structuredDates[0]) : undefined
        if (dateNode) {
          nodes.push(...eventDateRelationNodes(structuredDates))
          nodes.push(dateNode)
          items.push({ name: String(dateNode.name), url: String(dateNode.url) })
        }
        break
      }
    }
  }

  return {
    items: uniqueListItems(items),
    nodes: uniqueById(nodes),
  }
}

function programListItems(programs: Program[]): ListItemInput[] {
  return programs.map((program) => ({
    name: program.name,
    url: absoluteUrl(`/programs/${program.slug}`),
  }))
}

function uniqueListItems(items: ListItemInput[]): ListItemInput[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}

function firstLayoutImage(page: Page | null | undefined): string | undefined {
  const block = page?.layout?.find((candidate) => 'backgroundMedia' in candidate && candidate.backgroundMedia)
  if (!block || !('backgroundMedia' in block)) return undefined
  return absoluteMediaUrl(block.backgroundMedia)
}

function eventDateId(tripUrl: string, date: EventDate) {
  return `${tripUrl}#event-date-${date.id}`
}

function cmsPageSchemaType(value: string | null | undefined): CmsPageSchemaType {
  return CMS_PAGE_SCHEMA_TYPES.has(value as CmsPageSchemaType)
    ? (value as CmsPageSchemaType)
    : 'WebPage'
}

function availabilityFor(date: EventDate) {
  if (typeof date.remainingSeats === 'number') return date.remainingSeats > 0 ? IN_STOCK : SOLD_OUT
  if (typeof date.bookedSeats === 'number') return date.capacity - date.bookedSeats > 0 ? IN_STOCK : SOLD_OUT
  return date.capacity > 0 ? IN_STOCK : SOLD_OUT
}

function docs<T>(items: Maybe<T>[] | null | undefined): T[] {
  if (!items) return []
  return items.filter(isDoc)
}

function mediaUrls(items: Maybe<Media>[]): string[] | undefined {
  const urls = items.map(absoluteMediaUrl).filter((url): url is string => Boolean(url))
  return urls.length ? urls : undefined
}

function uniqueById(nodes: JsonLdObject[]): JsonLdObject[] {
  const seen = new Set<JsonLdValue>()
  return nodes.filter((node) => {
    const id = node['@id']
    if (!id) return true
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function isJsonLdObject(value: JsonLdObject | undefined): value is JsonLdObject {
  return Boolean(value)
}

function isDoc<T>(value: Maybe<T>): value is T {
  return Boolean(value && typeof value === 'object')
}

function text(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, ' ').trim()
  return normalized || undefined
}

function collectText(value: unknown, parts: string[]) {
  if (!value || typeof value !== 'object') return

  if ('text' in value && typeof value.text === 'string') {
    parts.push(value.text)
  }

  if ('children' in value && Array.isArray(value.children)) {
    value.children.forEach((child) => collectText(child, parts))
  }

  if ('root' in value) collectText(value.root, parts)
}

function prune(value: unknown): unknown {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return text(value)
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    const array = value.map(prune).filter((item) => item !== undefined)
    return array.length > 0 ? array : undefined
  }

  const entries = Object.entries(value)
    .map(([key, entryValue]) => [key, prune(entryValue)] as const)
    .filter(([, entryValue]) => entryValue !== undefined)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}
