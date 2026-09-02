/**
 * Extract legacy Rockbusters events and event dates from the local Postgres dump.
 *
 * The default source is the Docker container created for the legacy dump:
 *
 *   pnpm data-import:extract-legacy-events
 *
 * Override with LEGACY_PG_CONTAINER, LEGACY_PG_USER, or LEGACY_PG_DATABASE when needed.
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
  const { stdout } = await execFileAsync('docker', [
    'exec',
    container,
    'psql',
    '-U',
    user,
    '-d',
    database,
    '-At',
    '-c',
    sql,
  ], { maxBuffer: 128 * 1024 * 1024 })

  return stdout.trim()
}

async function writeJson(name: string, rowsJson: string) {
  await fs.mkdir(SEED_DIR, { recursive: true })
  const file = path.join(SEED_DIR, `${name}.json`)
  const rows = JSON.parse(rowsJson) as unknown[]
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
  console.log(`extract: ${name}: ${rows.length} rows -> ${path.relative(process.cwd(), file)}`)
}

async function main() {
  const eventsJson = await psqlJson(`
    select coalesce(json_agg(row_to_json(src) order by src.id), '[]'::json)
    from (
      select
        e.id,
        e.title,
        e.slug,
        e.perex,
        e.body,
        e.display,
        e."coverImage_id" as "coverImageId",
        e."fbShareImage_id" as "fbShareImageId",
        e."privateGuiding" as "privateGuiding",
        e."testCenter" as "testCenter",
        e.keywords,
        e.description,
        e."pageTitle" as "pageTitle",
        e."includeText" as "includeText",
        e."itineraryText" as "itineraryText",
        e.body_more as "bodyMore",
        e.included,
        e.excluded,
        e.accommodation,
        e.food,
        e."whatTobring" as "whatToBring",
        e."needToKnow1" as "needToKnow1",
        e."needToKnow2" as "needToKnow2",
        e."needToKnow3" as "needToKnow3",
        e."needToKnow4" as "needToKnow4",
        e."typicalDayTime1" as "typicalDayTime1",
        e."typicalDayTime2" as "typicalDayTime2",
        e."typicalDayTime3" as "typicalDayTime3",
        e."typicalDayTime4" as "typicalDayTime4",
        e."typicalDayTime5" as "typicalDayTime5",
        e."typicalDayTime6" as "typicalDayTime6",
        e."typicalDayTime7" as "typicalDayTime7",
        e."typicalDayTime8" as "typicalDayTime8",
        e."typicalDayDescription1" as "typicalDayDescription1",
        e."typicalDayDescription2" as "typicalDayDescription2",
        e."typicalDayDescription3" as "typicalDayDescription3",
        e."typicalDayDescription4" as "typicalDayDescription4",
        e."typicalDayDescription5" as "typicalDayDescription5",
        e."typicalDayDescription6" as "typicalDayDescription6",
        e."typicalDayDescription7" as "typicalDayDescription7",
        e."typicalDayDescription8" as "typicalDayDescription8",
        e.airport_departure_id as "airportDepartureId",
        e.airport_arrival_id as "airportArrivalId",
        coalesce((
          select json_agg(slug order by slug)
          from (
            select distinct l.slug
            from event_date ed
            join event_location el on el.event_id = ed.id
            join location l on l.id = el.location_id
            where ed.event_id = e.id
          ) location_slugs
        ), '[]'::json) as "locationSlugs",
        coalesce((
          select json_agg(et.member_id order by et.member_id)
          from event_team et
          where et.event_id = e.id
        ), '[]'::json) as "guideLegacyIds",
        coalesce((
          select json_agg(distinct edt.slug order by edt.slug)
          from event_date ed
          join event_date_to_event_date_type edtt on edtt.event_date_id = ed.id
          join event_date_type edt on edt.id = edtt.event_date_type_id
          where ed.event_id = e.id
        ), '[]'::json) as "typeSlugs"
      from event e
      order by e.id
    ) src
  `)

  const eventDatesJson = await psqlJson(`
    select coalesce(json_agg(row_to_json(src) order by src.id), '[]'::json)
    from (
      select
        ed.id,
        ed.event_id as "eventId",
        e.slug as "eventSlug",
        ed.slug,
        ed.title,
        ed.start,
        ed."end" as "end",
        ed.price,
        ed.capacity,
        ed.hidden,
        ed."full" as "full",
        ed.special,
        ed.featured,
        ed.body,
        ed."eventText" as "eventText",
        ed."bodyMore" as "bodyMore",
        ed.perex,
        ed."coverImage_id" as "coverImageId",
        ed."coverImageDetailPage_id" as "coverImageDetailPageId",
        ed."fbShareImage_id" as "fbShareImageId",
        ed.gallery_id as "galleryId",
        ed.airport_departure_id as "airportDepartureId",
        ed.airport_arrival_id as "airportArrivalId",
        ed."includeText" as "includeText",
        ed."itineraryText" as "itineraryText",
        ed.keywords,
        ed.description,
        ed."priceDetail" as "priceDetail",
        ed."pageTitle" as "pageTitle",
        ed."canonicalUrl" as "canonicalUrl",
        ed."vimeoId" as "vimeoId",
        ed.accommodation,
        ed.food,
        ed.included,
        ed.excluded,
        ed."whatTobring" as "whatToBring",
        coalesce((
          select json_agg(l.slug order by l.slug)
          from event_location el
          join location l on l.id = el.location_id
          where el.event_id = ed.id
        ), '[]'::json) as "locationSlugs",
        coalesce((
          select json_agg(edt.member_id order by edt.member_id)
          from event_date_team edt
          where edt.event_date_id = ed.id
        ), '[]'::json) as "guideLegacyIds",
        coalesce((
          select json_agg(distinct edt.slug order by edt.slug)
          from event_date_to_event_date_type edtt
          join event_date_type edt on edt.id = edtt.event_date_type_id
          where edtt.event_date_id = ed.id
        ), '[]'::json) as "typeSlugs",
        coalesce((
          select json_agg(mgm.media_id order by mgm.position, mgm.id)
          from media__gallery_media mgm
          where mgm.gallery_id = ed.gallery_id and mgm.enabled = 1
        ), '[]'::json) as "galleryMediaIds"
      from event_date ed
      join event e on e.id = ed.event_id
      order by ed.id
    ) src
  `)

  await writeJson('legacy-events', eventsJson)
  await writeJson('legacy-event-dates', eventDatesJson)
}

main().catch((err) => {
  console.error('legacy event extract failed:', err)
  process.exit(1)
})
