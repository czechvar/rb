import { describe, expect, it } from 'vitest'
import { getTestPayload } from '../helpers/payload'

describe('events collection', () => {
  it('creates an event with default draft state and auto slug', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state is intentionally omitted to verify the collection's defaultValue
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Multi-Pitch Course ${Date.now()}`,
        shortDescription: 'Learn multi-pitch climbing.',
      },
    })
    expect(doc.id).toBeDefined()
    expect(doc.slug).toMatch(/^multi-pitch-course-/)
    expect(doc.state).toBe('draft')
    expect(doc.featured).toBe(false)
  })

  it('attaches multiple locations to an event (hasMany)', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const a = await payload.create({
      collection: 'locations',
      data: { name: `Loc A ${Date.now()}`, active: true },
    })
    // @ts-expect-error slug is auto-filled by the slugField beforeValidate hook
    const b = await payload.create({
      collection: 'locations',
      data: { name: `Loc B ${Date.now()}`, active: true },
    })
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'events',
      data: { title: `Multi-Loc ${Date.now()}`, locations: [a.id, b.id] },
    })
    const ids = (doc.locations ?? []).map(l => (typeof l === 'object' ? l.id : l))
    expect(ids).toEqual([a.id, b.id])
  })

  it('stores highlights, audience cards, prerequisites, essential equipment', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Marketing Event ${Date.now()}`,
        highlights: [{ text: 'Five resorts' }, { text: 'Coached daily' }],
        audienceCards: [
          { heading: 'Intermediate', body: 'Red runs.', highlighted: true },
          { heading: 'Advanced', body: 'Black runs.', highlighted: true },
        ],
        prerequisites: [{ text: 'Comfortable on red' }],
        equipmentIntro: 'Everything you need on the mountain.',
        essentialEquipment: [
          { icon: '🎿', name: 'Skis or Snowboard', note: 'Rent or bring your own', mandatory: false },
          { icon: '⛑️', name: 'Helmet', note: 'Mandatory', mandatory: true },
        ],
      },
    })
    expect(doc.highlights).toHaveLength(2)
    expect(doc.audienceCards?.[0].highlighted).toBe(true)
    expect(doc.prerequisites).toHaveLength(1)
    expect(doc.equipmentIntro).toContain('Everything')
    expect(doc.essentialEquipment).toHaveLength(2)
    expect(doc.essentialEquipment?.[1].mandatory).toBe(true)
    expect(doc.essentialEquipment?.[0].mandatory).toBe(false)
  })

  it('stores whatYouLearn 2-col group', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Learn Event ${Date.now()}`,
        whatYouLearn: {
          intro: 'Real skill development.',
          box1Heading: 'On-Piste Technique',
          box1Bullets: [{ text: 'Euro carving' }, { text: 'Edge control' }],
          box2Heading: 'Progression & Mindset',
          box2Bullets: [{ text: 'Video analysis' }],
        },
      },
    })
    expect(doc.whatYouLearn?.box1Heading).toBe('On-Piste Technique')
    expect(doc.whatYouLearn?.box1Bullets).toHaveLength(2)
    expect(doc.whatYouLearn?.box2Bullets).toHaveLength(1)
  })

  it('stores a Day-by-Day itinerary with up to 14 days', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Itinerary Event ${Date.now()}`,
        itinerary: {
          intro: 'Order designed to build momentum.',
          days: [
            {
              dayBadge: 'DAY 1',
              destinationIcon: '⛷️',
              destinationName: 'Zell am See',
              metaLine: '1,670m – 2,000m · 77 km pistes',
              eyebrow: 'Day 1 · Arrival & First Turns',
              heading: 'Alpine Charm Meets World-Class Grooming',
              description: 'Start your Austrian adventure...',
              highlightTags: [{ text: '🎿 77 km diverse pistes' }, { text: '📹 First video analysis' }],
              schedule: [
                { time: '09:00', activity: 'Meet coaches' },
                { time: '12:30', activity: 'Lunch' },
                { time: '16:30', activity: 'Video analysis' },
              ],
            },
          ],
        },
      },
    })
    expect(doc.itinerary?.days).toHaveLength(1)
    expect(doc.itinerary?.days?.[0].destinationName).toBe('Zell am See')
    expect(doc.itinerary?.days?.[0].schedule).toHaveLength(3)
    expect(doc.itinerary?.days?.[0].highlightTags).toHaveLength(2)
  })

  it('rejects itinerary with more than 14 days', async () => {
    const payload = await getTestPayload()
    const tooMany = Array.from({ length: 15 }, (_, i) => ({
      destinationName: `Day ${i + 1}`,
    }))
    await expect(
      // @ts-expect-error state defaulted
      payload.create({
        collection: 'events',
        data: {
          title: `Overflow Event ${Date.now()}`,
          itinerary: { days: tooMany },
        },
      }),
    ).rejects.toThrow()
  })

  it('stores accommodation (with cuisine), transport with airports', async () => {
    const payload = await getTestPayload()
    const airport = await payload.create({
      collection: 'airports',
      data: { name: `SZG ${Date.now()}`, iata: `S${Date.now().toString().slice(-2)}`, active: true },
    })
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Logistics Event ${Date.now()}`,
        accommodation: {
          included: [{ text: 'Shared room' }],
          notIncluded: [{ text: 'Travel' }],
        },
        transport: { airports: [airport.id] },
      },
    })
    expect(doc.accommodation?.included).toHaveLength(1)
    expect(doc.accommodation?.notIncluded).toHaveLength(1)
    const airportIds = (doc.transport?.airports ?? []).map(a => (typeof a === 'object' ? a.id : a))
    expect(airportIds).toContain(airport.id)
  })

  it('attaches coaches relation and team bullets', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug auto-filled
    const guide = await payload.create({
      collection: 'guides',
      data: { name: `Coach ${Date.now()}`, active: true },
    })
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Coaches Event ${Date.now()}`,
        coachFramingParagraph: 'We live what we teach.',
        coaches: [guide.id],
        coachTeamBullets: [{ text: 'Max 8 riders' }, { text: 'Daily video analysis' }],
      },
    })
    const coachIds = (doc.coaches ?? []).map(c => (typeof c === 'object' ? c.id : c))
    expect(coachIds).toContain(guide.id)
    expect(doc.coachTeamBullets).toHaveLength(2)
  })

  it('attaches a partner with benefit copy', async () => {
    const payload = await getTestPayload()
    // @ts-expect-error slug auto-filled
    const partner = await payload.create({
      collection: 'partners',
      data: { name: `DOWN SKIS ${Date.now()}`, active: true },
    })
    // @ts-expect-error state defaulted
    const doc = await payload.create({
      collection: 'events',
      data: {
        title: `Partner Event ${Date.now()}`,
        partner: partner.id,
        partnerEyebrow: 'Exclusive Partnership',
        partnerHeadline: 'Try Before You Buy',
        partnerDescription: 'Test the latest gear on the mountain.',
        partnerBenefits: [
          { text: 'Test top-of-the-line models' },
          { text: 'Swap during the week' },
        ],
      },
    })
    const partnerId = typeof doc.partner === 'object' ? doc.partner?.id : doc.partner
    expect(partnerId).toBe(partner.id)
    expect(doc.partnerBenefits).toHaveLength(2)
  })
})
