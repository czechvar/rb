import { afterEach, describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { getPublishedPageBySlug } from '@/lib/queries'
import { resolveTripGridEvents } from '@/lib/block-resolvers/trip-grid'

const trackedIds: Record<string, number[]> = {}

describe('pages collection and CMS block bindings', () => {
  afterEach(async () => {
    const payload = await getTestPayload()

    for (const collection of ['event-dates', 'events', 'pages']) {
      const ids = trackedIds[collection]
      if (!ids?.length) continue
      await payload.delete({ collection: collection as never, where: { id: { in: ids } } })
      trackedIds[collection] = []
    }
  })

  it('creates and resolves a published CMS page with approved blocks', async () => {
    const payload = await getTestPayload()
    const slug = `cms-page-${Date.now()}`

    const createdPage = await payload.create({
      collection: 'pages',
      data: {
        title: 'CMS Page Integration',
        slug,
        status: 'published',
        layout: [
          {
            blockType: 'hero',
            heading: 'Editor-composed page',
            body: 'A page assembled from approved Payload blocks.',
            variant: 'simple',
          },
          {
            blockType: 'cta',
            heading: 'Reusable CTA',
            variant: 'dark',
            primaryAction: {
              label: 'View trips',
              href: '/programs',
            },
          },
        ],
      },
    })
    track('pages', createdPage.id)

    const page = await getPublishedPageBySlug(slug)
    expect(page?.title).toBe('CMS Page Integration')
    expect(page?.layout?.map((block) => block.blockType)).toEqual(['hero', 'cta'])
  })

  it('does not expose draft CMS pages through public collection reads', async () => {
    const payload = await getTestPayload()
    const slug = `cms-page-draft-${Date.now()}`

    const createdPage = await payload.create({
      collection: 'pages',
      overrideAccess: true,
      data: {
        title: 'Draft CMS Page',
        slug,
        status: 'draft',
        layout: [
          {
            blockType: 'hero',
            heading: 'Draft-only content',
            variant: 'simple',
          },
        ],
      },
    })
    track('pages', createdPage.id)

    const { docs } = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      where: { slug: { equals: slug } },
    })

    expect(docs).toEqual([])
  })

  it('resolves manual trip-grid bindings to published events only', async () => {
    const payload = await getTestPayload()
    const runId = Date.now()
    const published = await payload.create({
      collection: 'events',
      data: {
        title: `Published CMS Event ${runId}`,
        slug: `published-cms-event-${runId}`,
        state: 'published',
      },
    })
    track('events', published.id)
    const draft = await payload.create({
      collection: 'events',
      data: {
        title: `Draft CMS Event ${runId}`,
        slug: `draft-cms-event-${runId}`,
        state: 'draft',
      },
    })
    track('events', draft.id)
    const date = await payload.create({
      collection: 'event-dates',
      data: {
        event: published.id,
        dateFrom: '2030-09-12T00:00:00.000Z',
        dateTo: '2030-09-19T00:00:00.000Z',
        price: 1290,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', date.id)

    const events = await resolveTripGridEvents({
      source: 'manual',
      events: [published.id, draft.id],
      limit: 10,
    })

    expect(events.map((event) => event.id)).toEqual([published.id])
  })

  it('does not expose manual trip-grid events that only have past dates', async () => {
    const payload = await getTestPayload()
    const runId = Date.now()
    const current = await payload.create({
      collection: 'events',
      data: {
        title: `Current CMS Event ${runId}`,
        slug: `current-cms-event-${runId}`,
        state: 'published',
      },
    })
    track('events', current.id)
    const past = await payload.create({
      collection: 'events',
      data: {
        title: `Past CMS Event ${runId}`,
        slug: `past-cms-event-${runId}`,
        state: 'published',
      },
    })
    track('events', past.id)
    const currentDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: current.id,
        dateFrom: '2030-09-12T00:00:00.000Z',
        dateTo: '2030-09-19T00:00:00.000Z',
        price: 1290,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', currentDate.id)
    const pastDate = await payload.create({
      collection: 'event-dates',
      data: {
        event: past.id,
        dateFrom: '2020-08-12T00:00:00.000Z',
        dateTo: '2020-08-19T00:00:00.000Z',
        price: 1290,
        vat: 0,
        currency: 'EUR',
        capacity: 8,
        minParticipants: 2,
        active: true,
      },
    })
    track('event-dates', pastDate.id)

    const events = await resolveTripGridEvents({
      source: 'manual',
      events: [current.id, past.id],
      limit: 10,
    })

    expect(events.map((event) => event.id)).toEqual([current.id])
  })
})

function track(collection: string, id: number) {
  trackedIds[collection] = [...(trackedIds[collection] ?? []), id]
}
