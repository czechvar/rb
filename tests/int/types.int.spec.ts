import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('types collection — content fields', () => {
  it('creates a Type with auto-slug, draft state, and defaults', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state/featured/active intentionally omitted to verify defaults
    const doc = await payload.create({
      collection: 'types',
      data: {
        name: `Sport Climbing Camps ${Date.now()}`,
        shortDescription: 'Recurring sport climbing programs.',
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^sport-climbing-camps-/)
    expect(doc.state).toBe('draft')
    expect(doc.featured).toBe(false)
    expect(doc.active).toBe(false)
  })

  it('stores highlights, audience cards, and curriculum pillars', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'types',
      data: {
        name: `Camp With Marketing ${Date.now()}`,
        highlights: [{ text: 'One' }, { text: 'Two' }, { text: 'Three' }],
        audienceCards: [
          { heading: 'Skill Level', body: 'Lead 6b–8a', highlighted: false },
          { heading: 'Goals', body: 'Plateau breakthrough', highlighted: true },
          { heading: 'Mindset', body: 'Open to feedback', highlighted: false },
        ],
        soloNote: '70% travel solo',
        curriculumPillars: [
          {
            icon: '🧗',
            title: 'Technique & Movement',
            bullets: [{ text: 'Footwork' }, { text: 'Body positioning' }],
          },
          {
            icon: '🧠',
            title: 'Mental Performance',
            bullets: [{ text: 'Fall practice' }],
          },
        ],
      },
    })
    expect(doc.highlights).toHaveLength(3)
    expect(doc.audienceCards?.[1].highlighted).toBe(true)
    expect(doc.audienceCards?.[0].highlighted).toBe(false)
    expect(doc.soloNote).toBe('70% travel solo')
    expect(doc.curriculumPillars).toHaveLength(2)
    expect(doc.curriculumPillars?.[0].bullets).toHaveLength(2)
  })

  it('stores program flow with mix-and-match blocks, tailored bullets, focus tracks', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'types',
      data: {
        name: `Program Flow Camp ${Date.now()}`,
        programFlow: {
          framingParagraph: 'Performance lab, not a fixed schedule.',
          mixAndMatchBlocks: [
            {
              title: 'On-the-rock coaching',
              tagline: 'Real climbing, real feedback.',
              bullets: [{ text: 'Live feedback' }],
            },
          ],
          tailoredToYou: [{ text: 'Daily check-ins' }, { text: 'Adapt to energy' }],
          focusTracks: [
            { title: 'Performance breakthrough', colorTag: 'red', bullets: [{ text: 'Clear redpoint goal' }] },
            { title: 'Onsight confidence', colorTag: 'blue', bullets: [{ text: 'Decision making' }] },
          ],
        },
      },
    })
    expect(doc.programFlow?.framingParagraph).toContain('Performance lab')
    expect(doc.programFlow?.mixAndMatchBlocks).toHaveLength(1)
    expect(doc.programFlow?.tailoredToYou).toHaveLength(2)
    expect(doc.programFlow?.focusTracks?.[0].colorTag).toBe('red')
  })

  it('stores week variants, accommodation, transport, coaches, and results', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const guide = await payload.create({
      collection: 'guides',
      data: { name: `Coach ${Date.now()}`, active: true },
    })
    const airport = await payload.create({
      collection: 'airports',
      data: { name: `Test Airport ${Date.now()}`, iata: `T${Date.now()}`, active: true },
    })
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'types',
      data: {
        name: `Full Camp ${Date.now()}`,
        weekVariants: [
          { title: '1-week reset', bullets: [{ text: 'Powerful tune-up' }] },
          { title: '2-week deep dive', bullets: [{ text: 'Real breakthrough' }] },
        ],
        weekRecommendation: 'Go for two weeks if you can.',
        accommodation: {
          included: [{ text: 'Shared room' }],
          foodBeverages: [{ text: 'Shared kitchen' }],
          notIncluded: [{ text: 'Travel' }],
        },
        transport: { airports: [airport.id] },
        coaches: [guide.id],
        coachFramingParagraph: 'Coaches who lived it.',
        results: [{ text: 'Clear weakness map' }, { text: 'Personalised plan' }],
      },
    })
    expect(doc.weekVariants).toHaveLength(2)
    expect(doc.weekRecommendation).toContain('two weeks')
    expect(doc.accommodation?.included).toHaveLength(1)
    expect(doc.results).toHaveLength(2)
    const coachIds = (doc.coaches ?? []).map(c => (typeof c === 'object' ? c.id : c))
    expect(coachIds).toContain(guide.id)
  })
})
