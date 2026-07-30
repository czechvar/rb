/** READ-ONLY: dump exact identifiers of every record the cleanup would delete. */
import 'dotenv/config'
import { writeFileSync } from 'fs'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const p = await getPayload({ config })
const out: string[] = []

async function list(label: string, collection: string, where: unknown, field: string) {
  const r = await p.find({ collection: collection as never, where: where as never, limit: 1000, depth: 0 })
  out.push(`\n## ${label} (${r.totalDocs})`)
  for (const d of r.docs as Record<string, unknown>[]) out.push(`${d.id}\t${String(d[field])}`)
}

await list('orders of e2e users', 'orders', { 'user.email': { like: 'e2e-' } }, 'orderNumber')
await list('event-dates of E2E events', 'event-dates', { 'event.title': { like: 'E2E ' } }, 'dateFrom')
await list('events', 'events', { title: { like: 'E2E ' } }, 'title')
await list('posts', 'posts', { slug: { like: 'e2e-' } }, 'slug')
await list('post-categories', 'post-categories', { slug: { like: 'e2e-cat-' } }, 'slug')
await list('locations', 'locations', { slug: { like: 'e2e-crag-' } }, 'slug')
await list('guides', 'guides', { or: [{ slug: { like: 'e2e-guide-' } }, { slug: { like: 'e2e-friend-' } }] }, 'slug')
await list('users', 'users', {
  or: [
    { email: { like: 'e2e-' } },
    { email: { like: 'booking-e2e-' } },
    { email: { like: 'shell-e2e-' } },
    { email: { like: 'login-redirect-e2e-' } },
  ],
}, 'email')

writeFileSync('e2e-fixture-targets.txt', out.join('\n'))
console.log('written to e2e-fixture-targets.txt')
process.exit(0)
