/**
 * Deletes e2e test fixtures that leaked into the shared database.
 * Patterns mirror tests/e2e/*.spec.ts fixture naming. FK-safe order:
 * orders → event-dates → events → posts → post-categories → locations → guides → users.
 * Approved by Jan 2026-06-12 after read-only inventory (see e2e-fixture-inventory.ts).
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const p = await getPayload({ config })

const userEmailPatterns = [
  { email: { like: 'e2e-' } },
  { email: { like: 'booking-e2e-' } },
  { email: { like: 'shell-e2e-' } },
  { email: { like: 'login-redirect-e2e-' } },
]

async function wipe(label: string, collection: string, where: unknown) {
  const r = await p.delete({ collection: collection as never, where: where as never })
  const ok = (r as { docs?: unknown[] }).docs?.length ?? 0
  const errs = (r as { errors?: unknown[] }).errors ?? []
  console.log(`${label}: deleted ${ok}${errs.length ? `, ERRORS: ${JSON.stringify(errs).slice(0, 300)}` : ''}`)
}

await wipe('orders of e2e users', 'orders', { 'user.email': { like: 'e2e-' } })
await wipe('event-dates of E2E events', 'event-dates', { 'event.title': { like: 'E2E ' } })
await wipe('events', 'events', { title: { like: 'E2E ' } })
await wipe('posts', 'posts', { slug: { like: 'e2e-' } })
await wipe('post-categories', 'post-categories', { slug: { like: 'e2e-cat-' } })
await wipe('locations', 'locations', { slug: { like: 'e2e-crag-' } })
await wipe('guides', 'guides', {
  or: [{ slug: { like: 'e2e-guide-' } }, { slug: { like: 'e2e-friend-' } }],
})
await wipe('users', 'users', { or: userEmailPatterns })
process.exit(0)
