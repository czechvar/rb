import { describe, expect, it } from 'vitest'
import { eventDateActive, projectTypeSlugs } from '../../scripts/data-import/import-legacy-events'

describe('legacy events import mapper', () => {
  it('projects mixed legacy type slugs into current catalogue fields', () => {
    const projected = projectTypeSlugs(
      ['sport-climbing', 'beginner', 'kids-friendly', 'evolv-test-demo'],
      new Map([
        [
          'sport-climbing',
          {
            categories: ['climbing-camps'],
            programs: ['climbing-camps'],
            climbingStyles: ['sport'],
          },
        ],
        [
          'beginner',
          {
            difficulties: ['Beginner'],
            audienceTags: ['beginner-friendly'],
          },
        ],
        [
          'kids-friendly',
          {
            categories: ['climbing-camps'],
            audienceTags: ['kids-friendly'],
            formatTags: ['family-youth'],
          },
        ],
        [
          'evolv-test-demo',
          {
            formatTags: ['demo-test'],
            partnerTags: ['evolv'],
          },
        ],
      ]),
    )

    expect(projected).toEqual({
      categories: ['climbing-camps'],
      programs: ['climbing-camps'],
      difficulties: ['Beginner'],
      climbingStyles: ['sport'],
      audienceTags: ['beginner-friendly', 'kids-friendly'],
      formatTags: ['family-youth', 'demo-test'],
      partnerTags: ['evolv'],
    })
  })

  it('keeps hidden, full, or draft-parent date rows inactive', () => {
    const parent = { display: 1 } as Parameters<typeof eventDateActive>[1]
    const activeRow = { hidden: 0, full: 0 } as Parameters<typeof eventDateActive>[0]

    expect(eventDateActive(activeRow, parent)).toBe(true)
    expect(eventDateActive({ ...activeRow, hidden: 1 }, parent)).toBe(false)
    expect(eventDateActive({ ...activeRow, full: 1 }, parent)).toBe(false)
    expect(eventDateActive(activeRow, { display: 0 } as Parameters<typeof eventDateActive>[1])).toBe(
      false,
    )
  })
})
