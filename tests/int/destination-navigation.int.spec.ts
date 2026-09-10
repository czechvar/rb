import { describe, expect, it } from 'vitest'
import { destinationJumpNavItems } from '@/lib/destination-navigation'
import type { Location } from '@/payload-types'

type Detail = NonNullable<Location['destinationDetail']>
const links = (destinationDetail: Partial<Detail> = {}) => destinationJumpNavItems({ destinationDetail })

describe('Destination section navigation', () => {
  it('omits empty sections and groups, including gear groups with no items', () => {
    expect(links({ gearGroups: [{ heading: 'Gear', items: [] }] })).toEqual([])
  })

  it('links prose-only grades to the rendered article instead of a missing sectors grid', () => {
    expect(links({ sections: [{ key: 'grades', heading: 'Grades', body: 'Font 4 to 8A' }] }))
      .toEqual([{ href: '#destination-grades', label: 'Grades' }])
  })

  it('supports sectors alone and uses the earlier grades article when both exist', () => {
    const sectors = [{ name: 'Main sector' }]
    expect(links({ sectors })).toEqual([{ href: '#grades-sectors', label: 'Grades & sectors' }])
    expect(links({ sectors, sections: [{ key: 'grades', heading: 'Grades' }] }))
      .toEqual([{ href: '#destination-grades', label: 'Grades & sectors' }])
  })

  it('uses the article renderer heading predicate, including key-characteristic-only sections', () => {
    expect(links({ sections: [
      { key: 'intro', heading: 'Introduction', keyCharacteristics: ['Sandstone'] },
      { key: 'history', heading: '', body: 'Unrendered without a heading' },
    ] })).toEqual([{ href: '#destination-intro', label: 'Introduction' }])
  })

  it('includes only usable season records and populated logistics in display order', () => {
    expect(links({ seasonMonths: [{ month: 1, label: '', score: 3 }] })).toEqual([])
    expect(links({
      seasonMonths: [{ month: 1, label: 'Jan', score: 0 }],
      gearGroups: [{ heading: 'Equipment', items: ['Shoes'] }],
      transportOptions: [{ label: 'Car' }],
    })).toEqual([
      { href: '#best-season', label: 'Best season' },
      { href: '#gear', label: 'Gear' },
      { href: '#getting-there', label: 'Getting there' },
    ])
  })
})
