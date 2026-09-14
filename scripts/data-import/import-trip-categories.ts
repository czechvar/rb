/** Persistent catalogue taxonomy. Local-only; existing categories and event assignments are preserved. */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import definitions from './seed/trip-categories.json'
import { mergeCategorySeedRows } from './trip-category-seed'

async function main() {
  const url = new URL(process.env.DATABASE_URL || '')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Local database required')
  process.env.PAYLOAD_DISABLE_DB_PUSH = 'true'
  const config = await (await import('../../src/payload.config')).default
  config.logger = { options: { level: 'silent' } } as typeof config.logger
  const payload = await getPayload({ config })
  try {
    const eventAssignments = async () => {
      const result = await payload.find({ collection: 'events', pagination: false, depth: 0, sort: 'id', overrideAccess: true })
      return JSON.stringify(result.docs.map(({ id, categories, updatedAt }) => ({ id, categories, updatedAt })))
    }
    const before = await eventAssignments()
    const apply = process.argv.includes('--apply')
    let created = 0, updated = 0, unchanged = 0
    for (const definition of definitions) {
      const existing = await payload.find({ collection: 'categories', where: { slug: { equals: definition.slug } }, limit: 1, depth: 0, overrideAccess: true })
      const row = existing.docs[0]
      if (!row) {
        if (apply) await payload.create({ collection: 'categories', data: definition, overrideAccess: true })
        created++
      } else if (row.name !== definition.name || row.text !== definition.text || row.position !== definition.position || row.active !== definition.active) {
        if (apply) await payload.update({ collection: 'categories', id: row.id, data: definition, overrideAccess: true })
        updated++
      } else unchanged++
    }
    const assignmentsPreserved = before === await eventAssignments()
    if (!assignmentsPreserved) throw new Error('Event assignments changed')
    if (apply) {
      const all = await payload.find({ collection: 'categories', pagination: false, depth: 0, sort: 'id', overrideAccess: true })
      for (const definition of definitions) {
        const row = all.docs.find((item) => item.slug === definition.slug)
        if (!row || row.name !== definition.name || row.text !== definition.text || row.position !== definition.position || row.active !== definition.active) throw new Error('Read-back failed')
      }
      const file = path.resolve(import.meta.dirname, 'seed/canonical-payload-seed.json')
      const seed = JSON.parse(await fs.readFile(file, 'utf8'))
      const categories = seed.collections.find((item: { slug: string }) => item.slug === 'categories')
      if (!categories) throw new Error('Missing category seed collection')
      categories.rows = mergeCategorySeedRows(categories.rows, all.docs.filter((row) => definitions.some((definition) => definition.slug === row.slug)))
      await fs.writeFile(file, JSON.stringify(seed, null, 2) + '\n')
    }
    console.log(JSON.stringify({ applied: apply, created, updated, unchanged, assignmentsPreserved }))
  } finally { await payload.destroy() }
}
main().then(() => process.exit(0)).catch(() => { console.log(JSON.stringify({ categoryImportFailed: true })); process.exit(1) })
