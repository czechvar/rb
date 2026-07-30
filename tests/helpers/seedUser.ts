import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  name: 'Dev Admin',
  phone: '+420 777 000 001',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: { ...testUser, role: 'admin' },
  })

  // Mark the admin as verified so e2e login works (verify is on)
  const admin = await payload.find({
    collection: 'users',
    where: { email: { equals: testUser.email } },
    limit: 1,
  })
  if (admin.docs[0]) {
    await payload.update({
      collection: 'users',
      id: admin.docs[0].id,
      data: { _verified: true } as never,
      overrideAccess: true,
    })
  }
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
