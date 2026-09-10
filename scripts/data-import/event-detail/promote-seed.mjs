import fs from 'node:fs/promises'
import { connect, snapshot } from './source.mjs'
import { digest } from './mine.mjs'
import { proposedRows, validateManifest, validateSource } from './backfill.mjs'
const directory = process.argv[2] ?? '.scratch/event-detail-migration'
const filename = 'scripts/data-import/seed/canonical-payload-seed.json'
let client
try {
  const source = JSON.parse(await fs.readFile(`${directory}/source.json`, 'utf8'))
  const manifest = JSON.parse(await fs.readFile(`${directory}/manifest.json`, 'utf8'))
  validateManifest(source, manifest)
  client = await connect()
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const current = await snapshot(client)
  validateSource(source, current)
  const rows = proposedRows(manifest)
  for (const row of rows) {
    if (digest(row) !== digest(current.target.find(r => r.id === row.id))) throw new Error('Database differs from expected backfill')
  }
  const original = await fs.readFile(filename, 'utf8'), seed = JSON.parse(original)
  const events = seed.collections.find(c => c.slug === 'events').rows
  let changed = 0
  for (const event of manifest.events) {
    const values = rows.filter(r => r._parent_id === event.eventId).map(({ _order, _parent_id, ...r }) => r)
    if (!values.length) continue
    const target = events.find(e => e.slug === event.slug), origin = source.events.find(e => e.id === event.eventId)
    if (!target) throw new Error('Seed Event missing')
    if (target.tripDetail?.sections?.length) {
      if (digest(target.tripDetail.sections) !== digest(values)) throw new Error('Seed contains different editor sections')
      continue
    }
    for (const candidate of event.candidates.filter(c => c.outcome === 'copy-exact')) {
      if (candidate.sourcePath.startsWith('content.')) {
        if (digest(target.content) !== digest(origin.content)) throw new Error('Seed source content differs')
      } else {
        const sourceRow = source.children.events_additional_info.find(r => r._parent_id === origin.id && candidate.sourcePath.includes(`[id=${r.id}]`))
        if (!target.additionalInfo?.some(r => r.heading === sourceRow.heading && digest(r.body) === digest(sourceRow.body))) throw new Error('Seed additional-info source differs')
      }
    }
    target.tripDetail = { ...target.tripDetail, sections: values }
    changed++
  }
  // Only the new sections change; preserve seed metadata, records and existing fields.
  if (changed) {
    await fs.writeFile(`${directory}/canonical-seed-before.json`, original, { flag: 'wx' })
    await fs.writeFile(filename, JSON.stringify(seed, null, 2) + '\n')
  }
  await client.query('ROLLBACK')
  console.log(JSON.stringify({ databaseReadBackVerified: true, originalSourceUnchanged: true, seedEventsUpdated: changed, sectionsVerified: rows.length }))
} catch { console.error('Seed promotion failed; source or target precondition not satisfied.'); process.exitCode = 1 }
finally { await client?.end() }
