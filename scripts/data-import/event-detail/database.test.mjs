import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { connect, snapshot } from './source.mjs'
import { insertSections, proposedRows, validateSource } from './backfill.mjs'
import { buildManifest, digest } from './mine.mjs'
let client
let stage = 'connect'
try {
  client = await connect({ readOnly: false })
  const source = JSON.parse(await fs.readFile('.scratch/event-detail-migration/source.json', 'utf8'))
  const rows = proposedRows(buildManifest(source))
  const beforeExists = (await client.query("SELECT to_regclass('public.event_trip_sections') IS NOT NULL AS present")).rows[0].present
  const beforePublic = beforeExists ? (await client.query('SELECT id,_parent_id,_order,kind,heading,body FROM public.event_trip_sections ORDER BY id')).rows : []
  await client.query('BEGIN')
  await client.query('CREATE TEMP TABLE event_trip_migration_test_parents (id integer PRIMARY KEY)')
  await client.query('INSERT INTO event_trip_migration_test_parents SELECT id FROM public.events')
  // Exercise generated columns/constraints in a temporary schema; production tables are never modified.
  const migration = await fs.readFile('src/migrations/20260910_151403_event_trip_detail_sections.ts', 'utf8')
  const sql = migration.match(/export async function up[\s\S]*?sql`([\s\S]*?)`/)[1]
    .replace('REFERENCES "public"."events"', 'REFERENCES "pg_temp"."event_trip_migration_test_parents"')
    .replace('CREATE TYPE "public".', 'CREATE TYPE "pg_temp".')
    .replace('CREATE TABLE "event_trip_sections"', 'CREATE TEMP TABLE "event_trip_sections"')
  stage = 'temporary-schema'
  await client.query(sql)
  const initial = await snapshot(client)
  validateSource(source, initial)
  stage = 'first-insert'
  const first = await insertSections(client, rows)
  assert.equal(first.inserted.length, rows.length)
  stage = 'repeat-insert'
  const second = await insertSections(client, rows)
  assert.equal(second.inserted.length, 0)
  assert.ok(second.preserved.every(r => r.reason === 'already-applied'))
  const readBack = await snapshot(client)
  validateSource(source, readBack)
  for (const row of rows) assert.equal(digest(row), digest(readBack.target.find(r => r.id === row.id)))
  await client.query('UPDATE event_trip_sections SET heading=$1 WHERE id=$2', ['Temporary editor test value', rows[0].id])
  const third = await insertSections(client, rows)
  assert.equal(third.inserted.length, 0)
  assert.ok(third.preserved.some(r => r.reason === 'existing-editor-content'))
  assert.equal((await client.query('SELECT heading FROM event_trip_sections WHERE id=$1', [rows[0].id])).rows[0].heading, 'Temporary editor test value')
  stage = 'rollback-check'
  await client.query('ROLLBACK')
  const exists = (await client.query("SELECT to_regclass('public.event_trip_sections') IS NOT NULL AS present")).rows[0].present
  assert.equal(exists, beforeExists)
  const afterPublic = exists ? (await client.query('SELECT id,_parent_id,_order,kind,heading,body FROM public.event_trip_sections ORDER BY id')).rows : []
  assert.equal(digest(beforePublic), digest(afterPublic))
  console.log(JSON.stringify({ passed: true, schema: 'migration SQL in temporary schema', firstInsert: rows.length, repeatInsert: 0, editorContentPreserved: true, sourceUnchanged: true, rolledBack: true }))
} catch (error) {
  await client?.query('ROLLBACK').catch(() => {})
  console.error(JSON.stringify({ failed: true, stage, code: typeof error.code === 'string' ? error.code : null }))
  process.exitCode = 1
} finally { await client?.end() }
