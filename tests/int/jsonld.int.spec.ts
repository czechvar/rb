import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JsonLd, serializeJsonLd } from '@/components/JsonLd'
import {
  blogPostGraphJsonLd,
  businessName,
  calendarGraphJsonLd,
  collectionPageGraphJsonLd,
  eventDetailGraphJsonLd,
  eventDatesGraphJsonLd,
  genericCmsPageGraphJsonLd,
  guideDetailGraphJsonLd,
  homepageGraphJsonLd,
  locationDetailGraphJsonLd,
  postListItems,
  programDetailGraphJsonLd,
  richTextPlainText,
  structuredDataSiteUrl,
  tripFaqGraphJsonLd,
  tripListItems,
  tripLogisticsGraphJsonLd,
} from '@/lib/jsonld'
import type { Event, EventDate, Faq, Guide, Location, Media, Page, Post, Program } from '@/payload-types'

const media: Media = {
  id: 'med_jsonld_test',
  alt: 'Kalymnos cliff',
  url: '/media/kalymnos.jpg',
  updatedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const location: Location = {
  id: 20,
  name: 'Kalymnos',
  slug: 'kalymnos',
  city: 'Masouri',
  country: 'Greece',
  address: 'Main Road',
  coordinates: [26.98, 36.95],
  mainPicture: media,
  gallery: [{ ...media, id: 'med_jsonld_location_gallery', url: '/media/location-gallery.jpg' }],
  active: true,
  seo: { description: 'Limestone island climbing.' },
  updatedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const guide: Guide = {
  id: 30,
  name: 'Jany',
  slug: 'jany',
  role: 'Head coach',
  tagline: 'Patient movement coaching.',
  section: 'team',
  photo: media,
  active: true,
  updatedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const program: Program = {
  id: 40,
  name: 'Sport Climbing Holidays',
  slug: 'sport-climbing-holidays',
  shortDescription: 'Sport climbing trips for progressing climbers.',
  mainPicture: media,
  featured: true,
  active: true,
  state: 'published',
  updatedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const event: Event = {
  id: 50,
  title: 'Kalymnos Autumn Camp',
  slug: 'kalymnos-autumn-camp',
  shortDescription: 'A week of coached limestone climbing.',
  mainPicture: media,
  gallery: [{ ...media, id: 'med_jsonld_event_gallery', url: '/media/gallery.jpg' }],
  locations: [location],
  coaches: [guide],
  programs: [program],
  state: 'published',
  updatedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const eventDate: EventDate = {
  id: 60,
  event,
  dateFrom: '2026-10-12',
  dateTo: '2026-10-19',
  locations: [location],
  guides: [guide],
  price: 1290,
  vat: 21,
  currency: 'EUR',
  capacity: 8,
  bookedSeats: 6,
  remainingSeats: 2,
  active: true,
  updatedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const post: Post = {
  id: 70,
  title: 'How to prepare for Kalymnos',
  slug: 'prepare-for-kalymnos',
  heroImage: media,
  excerpt: 'Packing and movement notes for your climbing week.',
  author: 'Rockbusters Editorial',
  publishedAt: '2026-02-03T10:00:00.000Z',
  state: 'published',
  updatedAt: '2026-02-04T10:00:00.000Z',
  createdAt: '2026-02-01T10:00:00.000Z',
}

const page: Page = {
  id: 80,
  title: 'About Rockbusters',
  slug: 'about',
  status: 'published',
  seo: { description: 'Who Rockbusters climbs with and why.' },
  structuredData: { schemaType: 'AboutPage' },
  layout: [
    {
      heading: 'About Rockbusters',
      body: 'Small-group climbing trips.',
      backgroundMedia: media,
      variant: 'overlay',
      blockType: 'hero',
    },
  ],
  updatedAt: '2026-03-02T00:00:00.000Z',
  createdAt: '2026-03-01T00:00:00.000Z',
}

const faq: Faq = {
  id: 90,
  question: 'What should I pack?',
  answer: {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'Bring climbing shoes and a harness.', version: 1 }] },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
  event,
  active: true,
  updatedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('JSON-LD builders', () => {
  it('uses canonical structured-data identity defaults and overrides', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('STRUCTURED_DATA_SITE_URL', '')
    vi.stubEnv('STRUCTURED_DATA_BUSINESS_NAME', '')

    expect(structuredDataSiteUrl()).toBe('https://rockbusters.net')
    expect(structuredDataSiteUrl('/team')).toBe('https://rockbusters.net/team')
    expect(businessName()).toBe('Rockbusters')

    vi.stubEnv('STRUCTURED_DATA_SITE_URL', 'https://example.test/')
    vi.stubEnv('STRUCTURED_DATA_BUSINESS_NAME', 'Example Guides')

    expect(structuredDataSiteUrl('/team')).toBe('https://example.test/team')
    expect(businessName()).toBe('Example Guides')
  })

  it('builds trip graph nodes, offers, locations, guides, and breadcrumbs', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rockbusters.test')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'))

    const graph = eventDatesGraphJsonLd(event, [
      eventDate,
      { ...eventDate, id: 59, dateFrom: '2026-05-01', dateTo: '2026-05-08' },
      { ...eventDate, id: 61, active: false, remainingSeats: 0 },
    ])
    const nodes = graph['@graph'] as Record<string, unknown>[]
    const trip = nodes.find((node) => node['@id'] === 'https://rockbusters.test/trips/kalymnos-autumn-camp#trip')
    const dateNode = nodes.find((node) => node['@id'] === 'https://rockbusters.test/trips/kalymnos-autumn-camp#event-date-60')
    const breadcrumb = nodes.find((node) => node['@type'] === 'BreadcrumbList')

    expect(graph['@context']).toBe('https://schema.org')
    expect(trip?.['@type']).toEqual(['TouristTrip', 'Product'])
    expect(trip?.url).toBe('https://rockbusters.test/trips/kalymnos-autumn-camp')
    expect(trip?.image).toEqual([
      'https://rockbusters.test/media/kalymnos.jpg',
      'https://rockbusters.test/media/gallery.jpg',
    ])
    expect(trip?.offers).toEqual([
      expect.objectContaining({
        '@type': 'Offer',
        price: 1290,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: 'https://rockbusters.test/book/60',
      }),
    ])
    expect(dateNode).toEqual(
      expect.objectContaining({
        '@type': 'Event',
        startDate: '2026-10-12',
        endDate: '2026-10-19',
        location: [{ '@id': 'https://rockbusters.test/destinations/kalymnos#place' }],
        performer: [{ '@id': 'https://rockbusters.test/team/jany#person' }],
      }),
    )
    expect(breadcrumb?.itemListElement).toEqual([
      expect.objectContaining({ position: 1, name: 'Home' }),
      expect.objectContaining({ position: 2, name: 'Calendar' }),
      expect.objectContaining({ position: 3, name: 'Kalymnos Autumn Camp' }),
      expect.objectContaining({ position: 4, name: 'Dates' }),
    ])
    expect((breadcrumb?.itemListElement as Record<string, unknown>[])[1].item).toBe('https://rockbusters.test/calendar')
    expect((breadcrumb?.itemListElement as Record<string, unknown>[])[3].item).toBe('https://rockbusters.test/trips/kalymnos-autumn-camp/dates')
    expect(JSON.stringify(graph)).not.toContain('validFrom')
    expect(JSON.stringify(graph)).not.toContain('#event-date-59')
  })

  it('keeps dated offers off the main trip page graph', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rockbusters.test')

    const graph = eventDetailGraphJsonLd(event)
    const serialized = JSON.stringify(graph)

    expect(serialized).toContain('TouristTrip')
    expect(serialized).not.toContain('#event-date-60')
    expect(serialized).not.toContain('"price":1290')
  })

  it('builds program, location, and guide detail graphs from plain objects', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rockbusters.test/')

    const programGraph = programDetailGraphJsonLd(program, [event])
    const locationGraph = locationDetailGraphJsonLd(location, [event])
    const guideGraph = guideDetailGraphJsonLd(guide, [event])
    const programNodes = programGraph['@graph'] as Record<string, unknown>[]
    const locationNodes = locationGraph['@graph'] as Record<string, unknown>[]
    const guideNodes = guideGraph['@graph'] as Record<string, unknown>[]

    expect(programNodes).toContainEqual(expect.objectContaining({
      '@type': 'Course',
      '@id': 'https://rockbusters.test/programs/sport-climbing-holidays#program',
      name: 'Sport Climbing Holidays',
    }))
    expect(programNodes).toContainEqual(expect.objectContaining({
      '@type': 'ItemList',
      '@id': 'https://rockbusters.test/programs/sport-climbing-holidays#trips',
    }))
    expect(locationNodes).toContainEqual(expect.objectContaining({
      '@type': 'Place',
      '@id': 'https://rockbusters.test/destinations/kalymnos#place',
      additionalType: 'https://schema.org/TouristDestination',
      image: [
        'https://rockbusters.test/media/kalymnos.jpg',
        'https://rockbusters.test/media/location-gallery.jpg',
      ],
      address: expect.objectContaining({ addressLocality: 'Masouri', addressCountry: 'Greece' }),
      geo: { '@type': 'GeoCoordinates', longitude: 26.98, latitude: 36.95 },
    }))
    expect(guideNodes).toContainEqual(expect.objectContaining({
      '@type': 'Person',
      '@id': 'https://rockbusters.test/team/jany#person',
      jobTitle: 'Head coach',
      worksFor: { '@id': 'https://rockbusters.test/#organization' },
      subjectOf: { '@id': 'https://rockbusters.test/team/jany#trips' },
    }))
    expect(guideNodes).toContainEqual(expect.objectContaining({
      '@type': 'ProfilePage',
      '@id': 'https://rockbusters.test/team/jany#webpage',
      mainEntity: { '@id': 'https://rockbusters.test/team/jany#person' },
    }))
  })

  it('builds homepage and listing page graphs from visible records', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rockbusters.test')

    const homeGraph = await homepageGraphJsonLd({ page: null, heroMedia: media, featuredEvents: [event] })
    const listingGraph = collectionPageGraphJsonLd({
      path: '/programs',
      name: 'Programs',
      items: tripListItems([event]),
    })
    const homeNodes = homeGraph['@graph'] as Record<string, unknown>[]
    const listingNodes = listingGraph['@graph'] as Record<string, unknown>[]

    expect(homeNodes).toContainEqual(expect.objectContaining({
      '@type': 'WebSite',
      '@id': 'https://rockbusters.test/#website',
      publisher: { '@id': 'https://rockbusters.test/#organization' },
    }))
    expect(homeNodes).toContainEqual(expect.objectContaining({
      '@type': 'ItemList',
      '@id': 'https://rockbusters.test/#visible-catalogue',
      itemListElement: [
        expect.objectContaining({
          position: 1,
          name: 'Kalymnos Autumn Camp',
          url: 'https://rockbusters.test/trips/kalymnos-autumn-camp',
        }),
      ],
    }))
    expect(listingNodes).toContainEqual(expect.objectContaining({
      '@type': 'CollectionPage',
      '@id': 'https://rockbusters.test/programs#webpage',
      mainEntity: { '@id': 'https://rockbusters.test/programs#item-list' },
    }))
  })

  it('builds blog, calendar, and CMS page graphs', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rockbusters.test')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'))

    const blogListGraph = collectionPageGraphJsonLd({
      path: '/blog',
      name: 'Blog',
      items: postListItems([post]),
    })
    const postGraph = blogPostGraphJsonLd(post)
    const calendarGraph = calendarGraphJsonLd([eventDate])
    const cmsGraph = await genericCmsPageGraphJsonLd(page)
    const blogListNodes = blogListGraph['@graph'] as Record<string, unknown>[]
    const postNodes = postGraph['@graph'] as Record<string, unknown>[]
    const calendarNodes = calendarGraph['@graph'] as Record<string, unknown>[]
    const cmsNodes = cmsGraph['@graph'] as Record<string, unknown>[]

    expect(blogListNodes).toContainEqual(expect.objectContaining({
      '@type': 'ItemList',
      itemListElement: [
        expect.objectContaining({
          name: 'How to prepare for Kalymnos',
          url: 'https://rockbusters.test/blog/prepare-for-kalymnos',
        }),
      ],
    }))
    expect(postNodes).toContainEqual(expect.objectContaining({
      '@type': 'BlogPosting',
      '@id': 'https://rockbusters.test/blog/prepare-for-kalymnos#blogposting',
      headline: 'How to prepare for Kalymnos',
      author: { '@type': 'Person', name: 'Rockbusters Editorial' },
      datePublished: '2026-02-03T10:00:00.000Z',
    }))
    expect(calendarNodes).toContainEqual(expect.objectContaining({
      '@type': 'Event',
      '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp#event-date-60',
      url: 'https://rockbusters.test/trips/kalymnos-autumn-camp#dates',
      offers: expect.objectContaining({
        '@type': 'Offer',
        '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp#event-date-60-offer',
        url: 'https://rockbusters.test/book/60',
        price: 1290,
        itemOffered: { '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp#event-date-60' },
      }),
    }))
    expect(cmsNodes).toContainEqual(expect.objectContaining({
      '@type': 'AboutPage',
      '@id': 'https://rockbusters.test/cms-pages/about#webpage',
      name: 'About Rockbusters',
      description: 'Who Rockbusters climbs with and why.',
      primaryImageOfPage: 'https://rockbusters.test/media/kalymnos.jpg',
    }))
  })

  it('builds trip FAQ and logistics subpage graphs', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rockbusters.test')

    const faqGraph = tripFaqGraphJsonLd(event, [faq])
    const logisticsGraph = tripLogisticsGraphJsonLd(event)
    const faqNodes = faqGraph['@graph'] as Record<string, unknown>[]
    const logisticsNodes = logisticsGraph['@graph'] as Record<string, unknown>[]

    expect(faqNodes).toContainEqual(expect.objectContaining({
      '@type': 'FAQPage',
      '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp/faq#faq',
      mainEntity: [
        expect.objectContaining({
          '@type': 'Question',
          name: 'What should I pack?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Bring climbing shoes and a harness.',
          },
        }),
      ],
    }))
    expect(faqNodes).toContainEqual(expect.objectContaining({
      '@type': 'WebPage',
      '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp/faq#webpage',
      mainEntity: { '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp/faq#faq' },
    }))
    expect(logisticsNodes).toContainEqual(expect.objectContaining({
      '@type': 'WebPage',
      '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp/logistics#webpage',
      mainEntity: { '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp#trip' },
    }))
    expect(logisticsNodes).toContainEqual(expect.objectContaining({
      '@type': ['TouristTrip', 'Product'],
      '@id': 'https://rockbusters.test/trips/kalymnos-autumn-camp#trip',
    }))
  })

  it('extracts plain text from Lexical content and omits empty values', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rockbusters.test')

    const content = {
      root: {
        type: 'root',
        children: [
          { type: 'paragraph', version: 1, children: [{ type: 'text', text: ' First line ', version: 1 }] },
          { type: 'paragraph', version: 1, children: [{ type: 'text', text: 'second line', version: 1 }] },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    } satisfies Program['content']

    expect(richTextPlainText(content)).toBe('First line second line')

    const graph = programDetailGraphJsonLd({
      ...program,
      shortDescription: null,
      seo: { description: '' },
      content,
      gallery: [],
    })
    expect(JSON.stringify(graph)).not.toContain('gallery')
    expect(JSON.stringify(graph)).not.toContain('null')
    expect(JSON.stringify(graph)).not.toContain('undefined')
    expect((graph['@graph'] as Record<string, unknown>[]).find((node) => node['@type'] === 'Course')?.description).toBe('First line second line')
  })
})

describe('JsonLd component', () => {
  it('escapes JSON before embedding it in a script tag', () => {
    const data = { '@context': 'https://schema.org', name: '</script><div>&bad</div>' }

    expect(serializeJsonLd(data)).toContain('\\u003c/script\\u003e\\u003cdiv\\u003e\\u0026bad\\u003c/div\\u003e')
    expect(renderToStaticMarkup(createElement(JsonLd, { data }))).toContain('\\u003c/script\\u003e')
  })
})
