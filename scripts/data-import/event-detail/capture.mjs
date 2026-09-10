import fs from 'node:fs/promises'
import { connect, snapshot } from './source.mjs'
const directory = process.argv[2] ?? '.scratch/event-detail-migration'
let client
try {
  client = await connect()
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const mode = (await client.query('SHOW transaction_read_only')).rows[0].transaction_read_only
  if (mode !== 'on') throw new Error('Read-only assertion failed')
  const data = await snapshot(client)
  await fs.mkdir(directory, { recursive: true })
  // Refuse to replace a pre-migration source snapshot.
  await fs.writeFile(`${directory}/source.json`, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
  await client.query('ROLLBACK')
  console.log(JSON.stringify({ readOnly: true, localTarget: true, events: data.events.length, dates: data.dates.length, directory }))
} catch {
  console.error('Source capture failed; no database writes performed. Existing snapshot is never overwritten.')
  process.exitCode = 1
} finally { await client?.end() }
