import { expect, it } from 'vitest'
import { mergeCategorySeedRows } from '../../scripts/data-import/trip-category-seed'

it('preserves seed relationship IDs when local database IDs differ', () => {
  const seed = [{ id: 1, slug: 'existing', name: 'Existing' }, { id: 2, slug: 'retained', name: 'Retained' }]
  const source = [{ id: 99, slug: 'existing', name: 'Updated' }, { id: 1, slug: 'new', name: 'New' }]
  expect(mergeCategorySeedRows(seed, source)).toEqual([
    { id: 1, slug: 'existing', name: 'Updated' },
    { id: 2, slug: 'retained', name: 'Retained' },
    { id: 3, slug: 'new', name: 'New' },
  ])
  expect(seed[0].name).toBe('Existing')
  const merged = mergeCategorySeedRows(seed, source)
  expect(mergeCategorySeedRows(merged, source)).toEqual(merged)
})
