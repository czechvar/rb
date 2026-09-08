// @vitest-environment node
//
// `Users` is the collection `payload.config.ts` designates as `admin.user`, so
// its `access.admin` is what gates entry to /admin. Without it Payload lets any
// authenticated user of that collection load the panel — which meant every
// customer who signed up could reach it.
import { describe, expect, it } from 'vitest'
import type { Access } from 'payload'
import { Users } from '@/collections/Users'

/** Minimal stand-in for the `req` Payload hands an access function. */
function reqWith(user: unknown) {
  return { req: { user } } as unknown as Parameters<Access>[0]
}

describe('admin panel access', () => {
  const adminAccess = Users.access?.admin as Access | undefined

  it('is gated at all', () => {
    // The regression this whole file exists for: an absent `admin` rule is not
    // a permissive default in Payload's eyes, it is *no* rule — every logged-in
    // user gets in.
    expect(adminAccess).toBeTypeOf('function')
  })

  it('lets an admin in', () => {
    expect(adminAccess?.(reqWith({ id: 1, role: 'admin' }))).toBe(true)
  })

  it('keeps a customer out', () => {
    expect(adminAccess?.(reqWith({ id: 2, role: 'customer' }))).toBe(false)
  })

  it('keeps an anonymous visitor out', () => {
    expect(adminAccess?.(reqWith(undefined))).toBe(false)
    expect(adminAccess?.(reqWith(null))).toBe(false)
  })

  it('keeps out a user object with no role at all', () => {
    expect(adminAccess?.(reqWith({ id: 3 }))).toBe(false)
  })
})

describe('users data access is unchanged by the admin gate', () => {
  it('still lets a customer read only their own row', () => {
    const read = Users.access?.read as Access
    expect(read(reqWith({ id: 7, role: 'customer' }))).toEqual({ id: { equals: 7 } })
  })

  it('still lets an admin read everything', () => {
    const read = Users.access?.read as Access
    expect(read(reqWith({ id: 1, role: 'admin' }))).toBe(true)
  })

  it('still lets anyone sign up', () => {
    const create = Users.access?.create as Access
    expect(create(reqWith(undefined))).toBe(true)
  })
})
