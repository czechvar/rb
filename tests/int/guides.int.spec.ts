import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('guides collection', () => {
  it('creates a guide and auto-fills the slug', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const doc = await payload.create({
      collection: 'guides',
      data: { name: `Jane Doe ${Date.now()}`, email: 'jane@example.com', active: true },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^jane-doe-/)
    expect(doc.active).toBe(true)
    expect(doc.featured).toBe(false)
  })

  it('stores tagline and tags', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const guide = await payload.create({
      collection: 'guides',
      data: {
        name: `Tagline Guide ${Date.now()}`,
        section: 'team',
        tagline: 'Former World Cup champion.',
        tags: [{ text: 'Sport 9b' }, { text: 'Basque' }],
      },
    })
    expect(guide.tagline).toBe('Former World Cup champion.')
    expect(guide.tags?.map((t) => t.text)).toEqual(['Sport 9b', 'Basque'])
  })

  it('stores detail-page fields (stats, about, coaching, achievements, testimonial)', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const guide = await payload.create({
      collection: 'guides',
      data: {
        name: `Detail Guide ${Date.now()}`,
        section: 'team',
        heroSub: 'One relentless mission.',
        heroCaption: 'Jany · Pince Sans Rire 7b+',
        stats: [{ value: '25+', label: 'Years Climbing & Coaching' }],
        about: {
          headline: 'CLIMB\nBETTER,\n*MORE.*',
          facts: [{ label: 'Residence', value: 'Ústí nad Labem, CZ' }],
          quote: 'My goal is to find your boundaries.',
          quoteAttribution: '— Jany, on how he coaches',
        },
        coaching: {
          intro: 'From first footwork to fear management.',
          pillars: [{ title: 'Mental Coaching', body: 'Fear management.' }],
        },
        achievements: {
          intro: 'Recent redpoints.',
          items: [{ route: 'Botanic', location: 'Rodellar, Spain', grade: '8b+' }],
        },
        testimonial: {
          quote: 'Jany pushed me far beyond my limits.',
          name: 'Carmen Macgee',
          tripLine: 'Rockbusters Road Trip Client',
        },
      },
    })
    expect(guide.stats?.[0]?.value).toBe('25+')
    expect(guide.about?.headline).toContain('*MORE.*')
    expect(guide.about?.facts?.[0]?.label).toBe('Residence')
    expect(guide.coaching?.pillars?.[0]?.title).toBe('Mental Coaching')
    expect(guide.achievements?.items?.[0]?.grade).toBe('8b+')
    expect(guide.testimonial?.name).toBe('Carmen Macgee')
  })
})
