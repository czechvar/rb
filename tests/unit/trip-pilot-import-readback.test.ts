import { describe, expect, it } from 'vitest'
import { replacement } from '../../scripts/data-import/trip-editorial/replacement'
import { editorialMatches } from '../../scripts/data-import/kalymnos-editorial/editorial-readback'

describe('pilot import readback', () => {
  it('rejects stale optional content after a sparse refresh', () => {
    const before = {
      hero: { description: 'Old', hashtag: '#old' },
      dailySchedule: [{ title: 'Old day' }],
    }
    const desired = { hero: { description: 'New' } }
    const patch = replacement(before, desired)
    expect(editorialMatches({ ...before, hero: { ...before.hero, ...desired.hero } }, patch)).toBe(
      false,
    )
    expect(
      editorialMatches({ hero: { description: 'New', hashtag: null }, dailySchedule: [] }, patch),
    ).toBe(true)
  })
  it('verifies null-group rollback and rejects remaining content', () => {
    const before = { hero: { description: 'New' }, sections: [{ key: 'gallery' }] }
    const patch = replacement(before, null)
    expect(patch).toEqual({ hero: { description: null }, sections: [] })
    expect(editorialMatches(before, patch)).toBe(false)
    expect(editorialMatches({ hero: { description: null }, sections: [] }, patch)).toBe(true)
  })
  it('allows generated IDs/defaults but requires exact array length and authored values', () => {
    const desired = { sections: [{ key: 'gallery', clearHeading: true }] }
    const actual = {
      sections: [{ id: 'generated', visibility: 'inherit', key: 'gallery', clearHeading: true }],
    }
    expect(editorialMatches(actual, desired)).toBe(true)
    expect(editorialMatches({ sections: [...actual.sections, actual.sections[0]] }, desired)).toBe(
      false,
    )
    expect(
      editorialMatches({ sections: [{ ...actual.sections[0], clearHeading: false }] }, desired),
    ).toBe(false)
    expect(editorialMatches({ count: 0 }, { count: null })).toBe(false)
  })
})
