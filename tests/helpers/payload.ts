import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

let instance: Payload | undefined

/**
 * Returns a shared Payload instance bound to the test database
 * (DATABASE_URL from .env.test, loaded by vitest.setup.ts).
 */
export const getTestPayload = async (): Promise<Payload> => {
  instance ??= await getPayload({ config })
  return instance
}
