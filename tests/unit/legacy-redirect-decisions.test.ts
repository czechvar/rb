import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import config from '../../next.config'
import decisions from '@/lib/legacy-redirect-decisions.json'

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
      expect(rules.some(rule => rule.source === `/event/${slug}`)).toBe(false)
      expect(overview.get(`/event/${slug}`)?.target).toBe('')
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
})
