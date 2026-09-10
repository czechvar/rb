import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import dotenv from 'dotenv'
const require = createRequire(import.meta.url)
const { Client } = createRequire(require.resolve('@payloadcms/db-postgres'))('pg')

export async function connect({ readOnly = true } = {}) {
  const value = dotenv.parse(await fs.readFile('.env')).DATABASE_URL
  if (!value) throw new Error('DATABASE_URL missing')
  const target = new URL(value)
  if (target.hostname.includes('ep-weathered-pine-alvc3sdj')) throw new Error('Production target refused')
  // This one-off backfill is authorized for the local audited database only.
  if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new Error('Non-local target refused')
  const client = new Client({ connectionString: value, connectionTimeoutMillis: 10000,
    options: `-c default_transaction_read_only=${readOnly ? 'on' : 'off'} -c statement_timeout=30000` })
  await client.connect()
  return client
}

const eventFields = ['id', 'slug', 'title', 'state', 'short_description', 'content', 'main_picture_id',
  'catalogue_card_title', 'catalogue_card_description', 'equipment_intro', 'what_you_learn_intro',
  'what_you_learn_box1_heading', 'what_you_learn_box2_heading', 'itinerary_intro',
  'accommodation_description', 'accommodation_cuisine_highlights', 'transport_description',
  'coach_framing_paragraph', 'updated_at']
const dateFields = ['id', 'event_id', 'date_from', 'date_to', 'price', 'currency', 'capacity', 'active',
  'airport_from_id', 'airport_to_id', 'extra_content', 'logistics_overrides_accommodation',
  'logistics_overrides_food', 'logistics_overrides_included', 'logistics_overrides_excluded',
  'logistics_overrides_note']
const arrays = {
  events_additional_info: ['heading', 'body'], events_highlights: ['text'],
  events_audience_cards: ['heading', 'body', 'highlighted'], events_prerequisites: ['text'],
  events_essential_equipment: ['icon', 'name', 'note', 'mandatory'],
  events_what_you_learn_box1_bullets: ['text'], events_what_you_learn_box2_bullets: ['text'],
  events_itinerary_days: ['day_badge', 'destination_name', 'heading', 'description'],
  events_accommodation_included: ['text'], events_accommodation_not_included: ['text'],
}
export async function snapshot(client) {
  const query = async (sql) => (await client.query(sql)).rows
  const events = await query(`SELECT ${eventFields.join(',')} FROM events ORDER BY id`)
  const children = {}
  for (const [table, fields] of Object.entries(arrays)) {
    children[table] = await query(`SELECT id,_parent_id,_order,${fields.join(',')} FROM ${table} ORDER BY _parent_id,_order`)
  }
  const dates = await query(`SELECT ${dateFields.join(',')} FROM event_dates ORDER BY id`)
  const eventRelations = await query('SELECT parent_id,path,media_id,locations_id,guides_id,categories_id,difficulties_id,programs_id,airports_id FROM events_rels ORDER BY id')
  const dateRelations = await query('SELECT parent_id,path,locations_id,guides_id FROM event_dates_rels ORDER BY id')
  const locations = await query('SELECT id,slug,name,country,main_picture_id FROM locations ORDER BY id')
  const guides = await query('SELECT id,slug,name,photo_id FROM guides ORDER BY id')
  const airports = await query('SELECT id,name,iata FROM airports ORDER BY id')
  const media = await query('SELECT id,filename,alt FROM media ORDER BY id')
  const faqs = await query('SELECT id,event_id,question,answer,active FROM faqs ORDER BY id')
  const reviews = await query('SELECT id,event_id,quote,reviewer_name,active FROM reviews ORDER BY id')
  const exists = await query("SELECT to_regclass('public.event_trip_sections') IS NOT NULL AS present")
  const target = exists[0].present ? await query('SELECT id,_parent_id,_order,kind,heading,body FROM event_trip_sections ORDER BY _parent_id,_order') : []
  return { version: 1, events, children, dates, eventRelations, dateRelations, locations, guides, airports, media, faqs, reviews, target }
}
