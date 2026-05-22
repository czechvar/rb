import { describe, expect, it } from 'vitest'
import { slugify } from '../../src/fields/slug'
import { isAdmin } from '../../src/access'

describe('shared helpers', () => {
  it('slugifies a title', () => {
    expect(slugify('Beginner Multi-Pitch Course!')).toBe('beginner-multi-pitch-course')
  })

  it('isAdmin is true only for admin users', () => {
    expect(isAdmin({ req: { user: { role: 'admin' } } } as never)).toBe(true)
    expect(isAdmin({ req: { user: { role: 'customer' } } } as never)).toBe(false)
    expect(isAdmin({ req: { user: null } } as never)).toBe(false)
  })
})
