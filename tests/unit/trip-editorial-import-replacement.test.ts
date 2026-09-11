import { describe, expect, it } from 'vitest'
import { replacement } from '../../scripts/data-import/trip-editorial/replacement'

const document = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    children: [{ type: 'paragraph', children: [{ type: 'text', text }] }],
  },
})

describe('editorial import replacement patches', () => {
  it('preserves absent optional group shape on initial apply while clearing nested copy', () => {
    const current = {
      hero: { description: null },
      content: {
        transport: { description: 'old', note: null },
        content: document('old body'),
        audienceCards: [{ id: 'old', heading: 'old card' }],
      },
    }
    const snapshot = structuredClone(current)
    expect(replacement(current, { hero: { description: 'new' } })).toEqual({
      hero: { description: 'new' },
      content: { transport: { description: null, note: null }, content: null, audienceCards: [] },
    })
    expect(current).toEqual(snapshot)
  })

  it('clears explicitly null groups recursively for rollback instead of passing group null', () => {
    expect(
      replacement(
        {
          content: { transport: { description: 'Airport pickup' }, content: document('old') },
          dailySchedule: [{ title: 'Climb' }],
        },
        { content: null, dailySchedule: null },
      ),
    ).toEqual({ content: { transport: { description: null }, content: null }, dailySchedule: [] })
    expect(
      replacement({ hero: { description: 'new' }, sections: [{ key: 'gallery' }] }, null),
    ).toEqual({ hero: { description: null }, sections: [] })
  })

  it('replaces rich text atomically without retaining obsolete node fields', () => {
    const desired = document('new')
    const result = replacement({ root: { ...document('old').root, obsolete: true } }, desired)
    expect(result).toEqual(desired)
    expect(result).not.toBe(desired)
    expect(replacement(document('old'), null)).toBeNull()
  })

  it('replaces arrays with exact rows and preserves source IDs on rollback', () => {
    const desired = [{ id: 'original', key: 'gallery', heading: 'Original' }]
    expect(replacement([{ id: 'new', heading: 'New' }, { id: 'extra' }], desired)).toEqual(desired)
    expect(replacement([{ id: 'new' }], [])).toEqual([])
  })

  it('retains explicitly authored false, zero and empty strings', () => {
    expect(
      replacement({ hide: true, count: 8, label: 'Old' }, { hide: false, count: 0, label: '' }),
    ).toEqual({ hide: false, count: 0, label: '' })
  })
})
