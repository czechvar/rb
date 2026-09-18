import { describe, expect, it } from 'vitest'
import { Media } from '@/collections/Media'

describe('media upload identity', () => {
  it('generates document IDs on the server instead of shared bulk form state', async () => {
    const idField = Media.fields.find(
      (field): field is Extract<(typeof Media.fields)[number], { name: string }> =>
        'name' in field && field.name === 'id',
    )

    expect(idField).toBeDefined()
    expect(idField && 'defaultValue' in idField).toBe(false)

    const beforeValidate = idField && 'hooks' in idField ? idField.hooks?.beforeValidate?.[0] : undefined
    expect(beforeValidate).toBeDefined()

    const first = await beforeValidate!({ value: undefined } as never)
    const second = await beforeValidate!({ value: undefined } as never)

    expect(first).toMatch(/^med_[a-f0-9]{32}$/)
    expect(second).toMatch(/^med_[a-f0-9]{32}$/)
    expect(second).not.toBe(first)
  })
})
