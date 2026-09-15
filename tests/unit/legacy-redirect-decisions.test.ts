import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import config from '../../next.config'
import decisions from '@/lib/legacy-redirect-decisions.json'
import { isIndexableContentOnlyParentTrip, isIndexableParentTrip } from '@/lib/parent-trip-layout'

type OverviewRow = { target: string; action: string }

function redirectOverview(): Map<string, OverviewRow> {
  const csv = readFileSync('.scratch/sitemap-consolidation/legacy-redirect-overview.csv', 'utf8')
  // The first seven columns are unquoted paths and status codes; later notes may contain commas.
  return new Map(csv.split(/\r?\n/).slice(1).filter(Boolean).map(line => {
    const fields = line.split(',', 7)
    return [fields[2], { target: fields[4], action: fields[6] }]
  }))
}

describe('legacy redirect decisions', () => {
  it('sends missing Guides to /team before the exact-slug rule', async () => {
    const rules = await config.redirects?.() ?? []
    const overview = redirectOverview()
    const generic = rules.findIndex(rule => rule.source === '/team-member/:slug')
    expect(generic).toBeGreaterThan(0)
    for (const slug of decisions.missingTeamMemberSlugs) {
      const source = `/team-member/${slug}`
      const index = rules.findIndex(rule => rule.source === source)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(generic)
      expect(rules[index]).toMatchObject({ destination: '/team', permanent: true })
      expect(overview.get(source)?.target).toBe('/team')
    }
  })

  it('keeps existing suffixed Guide slugs rather than sending them to absent short slugs', async () => {
    const rules = await config.redirects?.() ?? []
    const overview = redirectOverview()
    expect(rules.find(rule => rule.source === '/team-member/:slug')).toMatchObject({
      destination: '/team/:slug', permanent: true,
    })
    for (const slug of [
      'adam-ondra-pro-climber', 'patxi-usobiaga-pro-climber',
      'daila-ojeda-pro-climber', 'pablo-scorza-fyziotherapist-biomechanica-funcional',
    ]) {
      expect(rules.some(rule => rule.source === `/team-member/${slug}`)).toBe(false)
      expect(overview.get(`/team-member/${slug}`)?.target).toBe(`/team/${slug}`)
    }
  })

  it('keeps temporary Event routes and the shareable CSV in agreement', async () => {
    const rules = await config.redirects?.() ?? []
    const overview = redirectOverview()
    for (const [slug, category] of Object.entries(decisions.temporaryEventCategoryRedirects)) {
      const source = `/event/${slug}`
      const destination = `/trips?category=${category}`
      expect(rules.find(rule => rule.source === source)).toMatchObject({ destination, permanent: false })
      expect(overview.get(source)).toEqual({ target: destination, action: 'temporary-category-redirect' })
    }
    for (const slug of ['singing-rock-mobile-test-center', 'rockbusters-summer-2018']) {
      expect(decisions.approvedLegacyEventPageRedirects).not.toHaveProperty(slug)
      expect(overview.get(`/event/${slug}`)).toEqual({
        target: '/trips', action: 'approved-trips-fallback-redirect',
      })
    }
  })

  it('routes historical Dates by audited trip category without replacing exact Variant candidates', async () => {
    const rules = await config.redirects?.() ?? []
    const overview = redirectOverview()
    expect(Object.keys(decisions.temporaryHistoricalDateCategoryRedirects)).toHaveLength(37)
    for (const [slug, category] of Object.entries(decisions.temporaryHistoricalDateCategoryRedirects)) {
      const source = `/event-date/${slug}`
      const destination = `/trips?category=${category}`
      expect(rules.find(rule => rule.source === source)).toMatchObject({ destination, permanent: false })
      expect(overview.get(source)).toEqual({ target: destination, action: 'temporary-date-category-redirect' })
    }
    expect(Object.values(decisions.temporaryHistoricalDateCategoryRedirects).filter(category => category === 'trad-multipitch')).toHaveLength(7)
    for (const slug of [
      'deep-water-solo-mallorca--2018-10-20-155',
      'climbing-trip-europe--2018-08-18-159',
    ]) {
      expect(rules.some(rule => rule.source === `/event-date/${slug}`)).toBe(false)
      expect(overview.get(`/event-date/${slug}`)?.action).toBe('redirect-candidate-needs-validation')
    }
  })

  it('keeps the ten approved old Event-page redirects aligned with the CSV', async () => {
    const rules = await config.redirects?.() ?? []
    const overview = redirectOverview()
    expect(Object.keys(decisions.approvedLegacyEventPageRedirects)).toHaveLength(10)
    for (const [slug, destination] of Object.entries(decisions.approvedLegacyEventPageRedirects)) {
      const source = `/event/${slug}`
      expect(rules.find(rule => rule.source === source)).toMatchObject({ destination, permanent: false })
      expect(overview.get(source)).toEqual({ target: destination, action: 'approved-event-page-redirect' })
    }
  })

  it('backs each approved Event-page target with an indexable parent in the canonical seed', () => {
    type SeedRow = {
      id?: number; slug?: string; state?: string; content?: unknown;
      active?: boolean; indexable?: boolean; event?: number; dateTo?: string;
    }
    const seed = JSON.parse(readFileSync('scripts/data-import/seed/canonical-payload-seed.json', 'utf8')) as {
      collections: Array<{ slug: string; rows: SeedRow[] }>
    }
    const rows = (collection: string) => seed.collections.find(group => group.slug === collection)?.rows ?? []
    const events = new Map(rows('events').map(event => [event.slug, event]))
    const variants = rows('trip-variants')
    const dates = rows('event-dates')
    for (const destination of Object.values(decisions.approvedLegacyEventPageRedirects)) {
      const slug = destination.replace('/trips/', '')
      const event = events.get(slug)
      expect(event?.state).toBe('published')
      const ownVariants = variants.filter(variant => variant.event === event?.id && variant.active === true)
      const currentDates = dates.filter(date => date.event === event?.id && date.active === true &&
        (date.dateTo ?? '') >= '2026-09-15')
      if (ownVariants.length) {
        expect(isIndexableParentTrip(event?.content, ownVariants.map(variant => ({
          active: variant.active === true, indexable: variant.indexable === true,
        })), slug)).toBe(true)
      } else {
        expect(isIndexableContentOnlyParentTrip(event?.content, 0, currentDates.length, slug)).toBe(true)
      }
    }
  })

  it('routes the old browse and fallback paths while retaining the CMS terms path', async () => {
    const rules = await config.redirects?.() ?? []
    const overview = redirectOverview()
    expect(decisions.legacyTripBrowseIndexRedirects).toEqual(['/event', '/event-date'])
    for (const source of decisions.legacyTripBrowseIndexRedirects) {
      expect(rules.find(rule => rule.source === source)).toMatchObject({ destination: '/trips', permanent: true })
      expect(overview.get(source)).toEqual({ target: '/trips', action: 'approved-browse-index-redirect' })
    }
    expect(decisions.legacyTripIndexFallbackPaths).toHaveLength(8)
    for (const source of decisions.legacyTripIndexFallbackPaths) {
      expect(rules.find(rule => rule.source === source)).toMatchObject({ destination: '/trips', permanent: false })
      expect(overview.get(source)).toEqual({ target: '/trips', action: 'approved-trips-fallback-redirect' })
    }
    expect(decisions.samePathCmsPageSlugs).toEqual(['terms-and-conditions'])
    expect(rules.some(rule => rule.source === '/terms-and-conditions')).toBe(false)
    expect(overview.get('/terms-and-conditions')).toEqual({
      target: '/terms-and-conditions', action: 'same-path-cms-production-pending',
    })
  })
})
