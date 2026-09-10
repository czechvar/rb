import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { connect, snapshot } from './source.mjs'
import { buildManifest, digest, sourceDigest } from './mine.mjs'

export function validateManifest(source, manifest) {
  if (digest(buildManifest(source)) !== digest(manifest)) throw new Error('Manifest does not match deterministic source extraction')
}
export function validateSource(source, current) {
  if (sourceDigest(source) !== sourceDigest(current)) throw new Error('Catalogue source changed since capture')
}
export function proposedRows(manifest) {
  return manifest.events.flatMap(event => event.candidates.filter(c => c.outcome === 'copy-exact').map((c, index) => ({
    id: c.id, _parent_id: event.eventId, _order: index + 1, ...c.value,
  })))
}
export async function insertSections(client, rows) {
  const inserted = [], preserved = []
  const eventIds = [...new Set(rows.map(r => r._parent_id))]
  for (const eventId of eventIds) {
    const existing = (await client.query('SELECT id,_parent_id,_order,kind,heading,body FROM event_trip_sections WHERE _parent_id=$1 ORDER BY _order', [eventId])).rows
    const wanted = rows.filter(r => r._parent_id === eventId)
    if (existing.length) {
      preserved.push({ eventId, reason: digest(existing) === digest(wanted) ? 'already-applied' : 'existing-editor-content' })
      continue
    }
    for (const row of wanted) {
      await client.query('INSERT INTO event_trip_sections (id,_parent_id,_order,kind,heading,body) VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
        [row.id, row._parent_id, row._order, row.kind, row.heading, JSON.stringify(row.body)])
      inserted.push(row)
    }
  }
  return { inserted, preserved }
}
export async function run(directory, apply = false) {
  const source = JSON.parse(await fs.readFile(`${directory}/source.json`, 'utf8'))
  const manifest = JSON.parse(await fs.readFile(`${directory}/manifest.json`, 'utf8'))
  validateManifest(source, manifest)
  const rows = proposedRows(manifest)
  let client
  try {
    client = await connect({ readOnly: !apply })
    await client.query(apply ? 'BEGIN ISOLATION LEVEL SERIALIZABLE' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    if (apply) {
      await client.query("SET LOCAL lock_timeout='5s'")
      await client.query('LOCK TABLE events, event_trip_sections IN SHARE ROW EXCLUSIVE MODE')
    }
    const current = await snapshot(client)
    validateSource(source, current)
    if (!apply) {
      await client.query('ROLLBACK')
      return { mode: 'dry-run', sourceUnchanged: true, events: new Set(rows.map(r => r._parent_id)).size, sections: rows.length }
    }
    const result = await insertSections(client, rows)
    const after = await snapshot(client)
    validateSource(source, after)
    for (const row of result.inserted) {
      const readBack = after.target.find(r => r.id === row.id)
      if (digest(readBack) !== digest(row)) throw new Error('Inserted section differs on read-back')
    }
    for (const row of current.target) {
      if (digest(after.target.find(r => r.id === row.id)) !== digest(row)) throw new Error('Existing section changed')
    }
    const report = { mode: 'apply', sourceUnchanged: true, sectionsInserted: result.inserted.length,
      eventsFilled: new Set(result.inserted.map(r => r._parent_id)).size, preserved: result.preserved,
      insertedIds: result.inserted.map(r => r.id), manifestDigest: digest(manifest) }
    // Persist the intended write set before commit; a failed commit leaves an explicit unconfirmed plan.
    await fs.mkdir(`${directory}/runs`, { recursive: true })
    const runDirectory = await fs.mkdtemp(`${directory}/runs/apply-`)
    await fs.writeFile(`${runDirectory}/intent.json`, JSON.stringify(report, null, 2) + '\n')
    await client.query('COMMIT')
    await fs.writeFile(`${runDirectory}/committed.json`, JSON.stringify(report, null, 2) + '\n')
    await fs.writeFile(`${directory}/applied.json`, JSON.stringify({ ...report, runDirectory }, null, 2) + '\n')
    return report
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {})
    throw error
  } finally { await client?.end() }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2)
    const result = await run(args.find(a => !a.startsWith('--')) ?? '.scratch/event-detail-migration', args.includes('--apply'))
    console.log(JSON.stringify({ mode: result.mode, sourceUnchanged: result.sourceUnchanged,
      events: result.events ?? result.eventsFilled, sections: result.sections ?? result.sectionsInserted,
      preserved: result.preserved?.length ?? 0 }))
  } catch { console.error('Backfill failed; inspect source/manifest/preconditions. Database transaction was rolled back if still open.'); process.exitCode = 1 }
}
