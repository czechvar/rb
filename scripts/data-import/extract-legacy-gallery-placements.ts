/**
 * Extract legacy gallery placements from event_date.gallery_id.
 *
 * The legacy model stores gallery membership separately from the entities that
 * place galleries. This snapshot keeps event/date/location context plus ordered
 * legacy media IDs for the Payload gallery migration importer.
 */
import './env'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const SEED_DIR = path.resolve(import.meta.dirname, 'seed')
const SOURCE = 'legacy postgres dump in rb-legacy-pg-20260827'

const container = process.env.LEGACY_PG_CONTAINER ?? 'rb-legacy-pg-20260827'
const user = process.env.LEGACY_PG_USER ?? 'rockbusters'
const database = process.env.LEGACY_PG_DATABASE ?? 'rockbusters_legacy'

async function psqlJson(sql: string) {
  const { stdout } = await execFileAsync(
    'docker',
    ['exec', container, 'psql', '-U', user, '-d', database, '-At', '-c', sql],
    { maxBuffer: 128 * 1024 * 1024 },
  )

  return stdout.trim()
}

async function main() {
  const rowsJson = await psqlJson(`
    select coalesce(json_agg(row_to_json(src) order by src."eventId", src.start, src."eventDateId"), '[]'::json)
    from (
      select
        ed.id as "eventDateId",
        ed.event_id as "eventId",
        e.slug as "eventSlug",
        ed.slug as "eventDateSlug",
        ed.start,
        ed.gallery_id as "galleryId",
        coalesce((
          select json_agg(l.slug order by l.slug)
          from event_location el
          join location l on l.id = el.location_id
          where el.event_id = ed.id
        ), '[]'::json) as "locationSlugs",
        coalesce((
          select json_agg(mgm.media_id order by mgm.position, mgm.id)
          from media__gallery_media mgm
          where mgm.gallery_id = ed.gallery_id and mgm.media_id is not null
        ), '[]'::json) as "galleryMediaIds"
      from event_date ed
      join event e on e.id = ed.event_id
      where ed.gallery_id is not null
      order by ed.event_id, ed.start, ed.id
    ) src
  `)

  const rows = JSON.parse(rowsJson) as unknown[]
  await fs.mkdir(SEED_DIR, { recursive: true })
  const file = path.join(SEED_DIR, 'legacy-gallery-placements.json')
  await fs.writeFile(
    file,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: SOURCE,
        rows,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  console.log(`extract: legacy-gallery-placements: ${rows.length} rows -> ${path.relative(process.cwd(), file)}`)
}

main().catch((err) => {
  console.error('legacy gallery placement extract failed:', err)
  process.exit(1)
})
