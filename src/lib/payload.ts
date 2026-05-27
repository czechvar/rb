import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

let cached: Payload | undefined

/**
 * Returns a shared Payload instance for server-component data fetching.
 * Cached across requests in a single Next.js server process.
 */
export async function getPayloadClient(): Promise<Payload> {
  if (!cached) cached = await getPayload({ config })
  return cached
}
