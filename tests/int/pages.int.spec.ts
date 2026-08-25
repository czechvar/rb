import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'
import { getPublishedPageBySlug } from '@/lib/queries'
import { resolveTripGridEvents } from '@/lib/block-resolvers/trip-grid'

describe('pages collection and CMS block bindings', () => {
  it('creates and resolves a published CMS page with approved blocks', async () => {
    const payload = await getTestPayload()
    const slug = `cms-page-${Date.now()}`

    await payload.create({
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

    const page = await getPublishedPageBySlug(slug)
    expect(page?.title).toBe('CMS Page Integration')
    expect(page?.layout?.map((block) => block.blockType)).toEqual(['hero', 'cta'])
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
    const draft = await payload.create({
      collection: 'events',
      data: {
        title: `Draft CMS Event ${runId}`,
        slug: `draft-cms-event-${runId}`,
        state: 'draft',
      },
    })

    const events = await resolveTripGridEvents({
      source: 'manual',
      events: [published.id, draft.id],
      limit: 10,
    })

    expect(events.map((event) => event.id)).toEqual([published.id])
  })
})
