/**
 * READ-ONLY inventory of e2e test fixtures that leaked into the database.
 * Patterns must mirror the fixture naming in tests/e2e/*.spec.ts.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const p = await getPayload({ config })

async function count(label: string, collection: string, where: unknown) {
  const r = await p.find({ collection: collection as never, where: where as never, limit: 0 })
  console.log(`${label}: ${r.totalDocs}`)
  return r.totalDocs
}

await count('guides (e2e-guide-*/e2e-friend-*)', 'guides', {
  or: [{ slug: { like: 'e2e-guide-' } }, { slug: { like: 'e2e-friend-' } }],
})
await count('locations (e2e-crag-*)', 'locations', { slug: { like: 'e2e-crag-' } })
await count('post-categories (e2e-cat-*)', 'post-categories', { slug: { like: 'e2e-cat-' } })
await count('posts (e2e-post-*/e2e-draft-post-*)', 'posts', { slug: { like: 'e2e-' } })
await count('events (E2E * titles)', 'events', { title: { like: 'E2E ' } })
await count('event-dates of E2E events', 'event-dates', { 'event.title': { like: 'E2E ' } })
await count('users (e2e/booking/shell/login-redirect fixtures)', 'users', {
  or: [
    { email: { like: 'e2e-' } },
    { email: { like: 'booking-e2e-' } },
    { email: { like: 'shell-e2e-' } },
    { email: { like: 'login-redirect-e2e-' } },
  ],
})
await count('orders by e2e users', 'orders', { 'customer.email': { like: 'e2e-' } })
process.exit(0)
