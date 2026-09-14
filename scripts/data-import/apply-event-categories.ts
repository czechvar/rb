/** Approved persistent content migration. Empty category lists mean hold unchanged. Local-only. */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createLocalReq, getPayload } from 'payload'
import assignments from './seed/event-category-assignments.json'

let stage = 'guard'
let databaseCommitted = false
async function main() {
  const url = new URL(process.env.DATABASE_URL || '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Local database required')
  process.env.PAYLOAD_DISABLE_DB_PUSH = 'true'
  const config = await (await import('../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  try {
    stage = 'preflight'
    const events = await payload.find({ collection: 'events', pagination: false, depth: 0, sort: 'id', overrideAccess: true })
    const categories = await payload.find({ collection: 'categories', pagination: false, depth: 0, overrideAccess: true })
    const seen = new Set<string>()
    const plan = assignments.map((item) => {
      if (seen.has(item.eventSlug)) throw new Error('Duplicate event mapping')
      seen.add(item.eventSlug)
      const event = events.docs.find((row) => row.slug === item.eventSlug)
      if (!event) throw new Error('Missing event')
      const ids = item.categorySlugs.map((slug) => {
        const category = categories.docs.find((row) => row.slug === slug && row.active)
        if (!category) throw new Error('Missing active category')
        return category.id
      })
      if (new Set(ids).size !== ids.length) throw new Error('Duplicate category assignment')
      return { event, ids, categorySlugs: item.categorySlugs }
    })
    const idsOf = (values: typeof events.docs[number]['categories']) => (values ?? []).map((value) => typeof value === 'object' ? value.id : value)
    const changed = plan.filter(({ event, ids }) => ids.length && JSON.stringify(idsOf(event.categories)) !== JSON.stringify(ids))
    const apply = process.argv.includes('--apply')
    if (!apply) { console.log(JSON.stringify({ apply: false, planned: changed.length, held: plan.filter((row) => !row.ids.length).length })); return }
    if (changed.length) {
      stage = 'backup'
      const directory = path.resolve('.scratch/event-category-application')
      await fs.mkdir(directory, { recursive: true, mode: 0o700 })
      await fs.writeFile(path.join(directory, `before-${Date.now()}.json`), JSON.stringify(changed.map(({ event }) => ({ id: event.id, slug: event.slug, categories: idsOf(event.categories), state: event.state, updatedAt: event.updatedAt })), null, 2), { mode: 0o600, flag: 'wx' })
      stage = 'update'
      const transactionID = await payload.db.beginTransaction()
      if (!transactionID) throw new Error('Transaction required')
      try {
        const req = await createLocalReq({}, payload)
        req.transactionID = transactionID
        for (const { event, ids } of changed) await payload.update({ collection: 'events', id: event.id, data: { categories: ids }, req, overrideAccess: true })
        await payload.db.commitTransaction(transactionID)
        databaseCommitted = true
      } catch (error) { await payload.db.rollbackTransaction(transactionID); throw error }
    }
    stage = 'readback'
    const after = await payload.find({ collection: 'events', pagination: false, depth: 0, sort: 'id', overrideAccess: true })
    if (after.docs.length !== events.docs.length) throw new Error('Event count changed')
    for (const before of events.docs) {
      const saved = after.docs.find((row) => row.id === before.id)
      const planned = plan.find((row) => row.event.id === before.id)
      const expected = planned?.ids.length ? planned.ids : idsOf(before.categories)
      if (!saved || saved.state !== before.state || JSON.stringify(idsOf(saved.categories)) !== JSON.stringify(expected)) throw new Error('Read-back failed')
    }
    stage = 'seed'
    const file = path.resolve(import.meta.dirname, 'seed/canonical-payload-seed.json')
    const seed = JSON.parse(await fs.readFile(file, 'utf8'))
    const seededCategories = seed.collections.find((row: { slug: string }) => row.slug === 'categories').rows as Array<{ slug: string; id: number }>
    const seededEvents = seed.collections.find((row: { slug: string }) => row.slug === 'events').rows as Array<{ slug: string; categories: number[]; updatedAt: string }>
    for (const row of plan.filter((row) => row.ids.length)) {
      const seeded = seededEvents.find((item) => item.slug === row.event.slug)
      const saved = after.docs.find((item) => item.id === row.event.id)
      if (!seeded || !saved) throw new Error('Missing seed event')
      seeded.categories = row.categorySlugs.map((slug) => {
        const category = seededCategories.find((item) => item.slug === slug)
        if (!category) throw new Error('Missing seed category')
        return category.id
      })
      seeded.updatedAt = saved.updatedAt
    }
    await fs.writeFile(file, JSON.stringify(seed, null, 2) + '\n')
    console.log(JSON.stringify({ applied: true, changed: changed.length, matched: plan.filter((row) => row.ids.length).length, held: plan.filter((row) => !row.ids.length).length, readbackPassed: true, publicationStatesPreserved: true, seedUpdated: true }))
  } finally { await payload.destroy() }
}
main().then(() => process.exit(0)).catch(() => { console.log(JSON.stringify({ categoryApplicationFailed: true, stage, databaseCommitted })); process.exit(1) })
