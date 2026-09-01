#!/usr/bin/env node
/**
 * Extract legacy Rockbusters location rows into reviewable destination source packets.
 *
 * This is not an importer. It writes deterministic files under .scratch by default
 * so subagents/editors can mine destination guide content without touching Payload.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_CONTAINER = 'rb-legacy-pg-20260827'
const DEFAULT_DB = 'rockbusters_legacy'
const DEFAULT_USER = 'rockbusters'
const DEFAULT_OUT = '.scratch/legacy-destination-export'
const LEGACY_LOCATION_BASE_URL = 'https://rockbusters.net/location'
const DESTINATION_BLUEPRINT = [
  'hero',
  'intro',
  'history',
  'rock',
  'who',
  'grades',
  'season',
  'gear',
  'transport',
  'stay',
  'restdays',
  'tips',
  'safety',
  'costs',
  'faq',
  'trips',
  'related',
]

function parseArgs(argv) {
  const args = {
    container: DEFAULT_CONTAINER,
    db: DEFAULT_DB,
    user: DEFAULT_USER,
    out: DEFAULT_OUT,
    only: null,
    includeHidden: false,
    includeRelatedEvents: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const readValue = () => {
      if (arg.includes('=')) return arg.slice(arg.indexOf('=') + 1)
      i += 1
      return argv[i]
    }

    if (arg === '--include-hidden') args.includeHidden = true
    else if (arg === '--include-related-events') args.includeRelatedEvents = true
    else if (arg === '--only' || arg.startsWith('--only=')) args.only = readValue()
    else if (arg === '--container' || arg.startsWith('--container=')) args.container = readValue()
    else if (arg === '--db' || arg.startsWith('--db=')) args.db = readValue()
    else if (arg === '--user' || arg.startsWith('--user=')) args.user = readValue()
    else if (arg === '--out' || arg.startsWith('--out=')) args.out = readValue()
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return args
}

function printHelp() {
  console.log(`Usage:
  node scripts/data-import/legacy/extract-destination-packets.mjs [options]

Options:
  --only <slug>          Extract one destination only
  --include-hidden       Include legacy location.display != 1 rows
  --include-related-events
                          Include legacy event/date relation context. Off by default.
  --out <dir>            Output directory, default ${DEFAULT_OUT}
  --container <name>     Postgres Docker container, default ${DEFAULT_CONTAINER}
  --db <name>            Database name, default ${DEFAULT_DB}
  --user <name>          Database user, default ${DEFAULT_USER}
`)
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function buildSql({ only, includeHidden, includeRelatedEvents }) {
  const where = []
  if (!includeHidden) where.push('l.display = 1')
  if (only) where.push(`l.slug = ${sqlLiteral(only)}`)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  return `
WITH location_rows AS (
  SELECT
    l.id,
    l.title,
    l.slug,
    l.body,
    l.latitude,
    l.longitude,
    l.keywords,
    l.description,
    l.display,
    l.country_id,
    c.iso AS country_code,
    c.iso3 AS country_code_3,
    c.nicename AS country,
    c.name AS country_name,
    m.id AS image_id,
    m.name AS image_name,
    m.description AS image_description,
    m.provider_name AS image_provider_name,
    m.provider_reference AS image_provider_reference,
    m.provider_metadata AS image_provider_metadata,
    m.width AS image_width,
    m.height AS image_height,
    m.content_type AS image_content_type,
    m.context AS image_context
  FROM location l
  LEFT JOIN country c ON c.id = l.country_id
  LEFT JOIN media__media m ON m.id = l.image_id
  ${whereSql}
)
SELECT COALESCE(jsonb_agg(
  jsonb_build_object(
    'source', jsonb_build_object(
      'legacyLocationId', lr.id,
      'legacySlug', lr.slug,
      'legacyUrl', ${sqlLiteral(LEGACY_LOCATION_BASE_URL)} || '/' || lr.slug,
      'legacyDisplay', lr.display
    ),
    'identity', jsonb_build_object(
      'name', lr.title,
      'publicName', lr.title,
      'slug', lr.slug,
      'country', lr.country,
      'countryName', lr.country_name,
      'countryCode', lr.country_code,
      'countryCode3', lr.country_code_3
    ),
    'seo', jsonb_build_object(
      'keywords', lr.keywords,
      'description', lr.description
    ),
    'facts', jsonb_build_object(
      'coordinates', CASE
        WHEN lr.latitude IS NULL OR lr.longitude IS NULL THEN NULL
        ELSE jsonb_build_array(lr.longitude, lr.latitude)
      END,
      'latitude', lr.latitude,
      'longitude', lr.longitude
    ),
    'media', jsonb_build_object(
      'mainImage', CASE WHEN lr.image_id IS NULL THEN NULL ELSE jsonb_build_object(
        'legacyMediaId', lr.image_id,
        'name', lr.image_name,
        'description', lr.image_description,
        'providerName', lr.image_provider_name,
        'providerReference', lr.image_provider_reference,
        'providerMetadata', lr.image_provider_metadata,
        'width', lr.image_width,
        'height', lr.image_height,
        'contentType', lr.image_content_type,
        'context', lr.image_context
      ) END
    ),
    'legacyContent', jsonb_build_object(
      'bodyHtml', lr.body
    ),
    'related', jsonb_build_object(
      'events', ${includeRelatedEvents ? `COALESCE((
        SELECT jsonb_agg(event_payload ORDER BY event_payload->>'slug')
        FROM (
          SELECT jsonb_build_object(
            'legacyEventId', e.id,
            'slug', e.slug,
            'title', e.title,
            'display', e.display = 1,
            'privateGuiding', COALESCE(e."privateGuiding", 0) = 1,
            'testCenter', COALESCE(e."testCenter", 0) = 1,
            'pageTitle', e."pageTitle",
            'description', e.description,
            'keywords', e.keywords,
            'perexHtml', e.perex,
            'bodyHtml', e.body,
            'bodyMoreHtml', e.body_more,
            'includeTextHtml', e."includeText",
            'itineraryTextHtml', e."itineraryText",
            'includedHtml', e.included,
            'excludedHtml', e.excluded,
            'accommodationHtml', e.accommodation,
            'foodHtml', e.food,
            'whatToBringHtml', e."whatTobring",
            'needToKnowHtml', jsonb_build_array(e."needToKnow1", e."needToKnow2", e."needToKnow3", e."needToKnow4"),
            'dateSummary', (
              SELECT jsonb_build_object(
                'count', COUNT(*),
                'visibleCount', COUNT(*) FILTER (WHERE ed.hidden = 0),
                'firstStart', MIN(ed.start),
                'lastStart', MAX(ed.start),
                'minPrice', MIN(ed.price),
                'maxPrice', MAX(ed.price)
              )
              FROM event_date ed
              WHERE ed.event_id = e.id
            ),
            'sampleDates', COALESCE((
              SELECT jsonb_agg(date_payload ORDER BY date_payload->>'start')
              FROM (
                SELECT jsonb_build_object(
                  'legacyEventDateId', ed.id,
                  'slug', ed.slug,
                  'title', ed.title,
                  'start', ed.start,
                  'end', ed.end,
                  'price', ed.price,
                  'priceDetail', ed."priceDetail",
                  'hidden', ed.hidden = 1,
                  'full', ed.full = 1,
                  'featured', ed.featured = 1,
                  'description', ed.description,
                  'perexHtml', ed.perex,
                  'bodyHtml', ed.body,
                  'eventTextHtml', ed."eventText",
                  'includeTextHtml', ed."includeText",
                  'itineraryTextHtml', ed."itineraryText",
                  'includedHtml', ed.included,
                  'excludedHtml', ed.excluded,
                  'accommodationHtml', ed.accommodation,
                  'foodHtml', ed.food,
                  'whatToBringHtml', ed."whatTobring",
                  'needToKnowHtml', jsonb_build_array(ed."needToKnow1", ed."needToKnow2", ed."needToKnow3", ed."needToKnow4")
                ) AS date_payload
                FROM event_date ed
                WHERE ed.event_id = e.id
                ORDER BY ed.hidden ASC, ed.start DESC
                LIMIT 8
              ) date_rows
            ), '[]'::jsonb)
          ) AS event_payload
          FROM event_location el
          JOIN event e ON e.id = el.event_id
          WHERE el.location_id = lr.id
        ) event_rows
      ), '[]'::jsonb)` : `'[]'::jsonb`}
    )
  )
  ORDER BY lr.country NULLS LAST, lr.title
), '[]'::jsonb)::text
FROM location_rows lr;
`
}

function runPsql(args, sql) {
  const result = spawnSync(
    'docker',
    ['exec', args.container, 'psql', '-U', args.user, '-d', args.db, '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 200 },
  )

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`psql failed with exit ${result.status}\n${result.stderr}`)
  }

  return result.stdout.trim()
}

function stripHtml(html) {
  if (!html) return ''
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function htmlLength(html) {
  return html ? String(html).trim().length : 0
}

function textLength(html) {
  return stripHtml(html).length
}

function hasMeaningfulText(html) {
  return textLength(html) >= 80
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function filenameForSlug(slug) {
  return `${slug.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.md`
}

function jsonFilenameForSlug(slug) {
  return `${slug.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.source.json`
}

function fence(value, language = 'html') {
  const body = value ? String(value).replaceAll('```', '``\\`') : ''
  return `\`\`\`${language}\n${body}\n\`\`\``
}

function qualityFor(record, options) {
  const warnings = []
  const events = record.related?.events ?? []
  const visibleEvents = events.filter((event) => event.display)

  if (!record.identity?.country) warnings.push('missing_country')
  if (!record.facts?.coordinates) warnings.push('missing_coordinates')
  if (!record.media?.mainImage) warnings.push('missing_main_image')
  if (!hasMeaningfulText(record.legacyContent?.bodyHtml)) warnings.push('missing_or_short_location_body')
  if (options.includeRelatedEvents && visibleEvents.length === 0) warnings.push('no_visible_related_events')
  if (/^test$/i.test(record.identity?.name ?? '')) warnings.push('placeholder_title')
  if ((record.source?.legacyDisplay ?? 0) !== 1) warnings.push('hidden_legacy_location')

  return {
    hasLegacyBody: hasMeaningfulText(record.legacyContent?.bodyHtml),
    hasMainImage: Boolean(record.media?.mainImage),
    relatedEventCount: events.length,
    visibleRelatedEventCount: visibleEvents.length,
    needsEditorialReview: true,
    warnings,
  }
}

function attachBlueprint(record, options) {
  const quality = qualityFor(record, options)
  return {
    ...record,
    extraction: {
      generatedAt: new Date().toISOString(),
      extractor: 'scripts/data-import/legacy/extract-destination-packets.mjs',
      mode: 'source-packet',
      note: 'DB-backed source packet only. Generated HTML designer files are not mined for copy.',
      includesRelatedEvents: options.includeRelatedEvents,
    },
    destinationGuideBlueprint: DESTINATION_BLUEPRINT.map((key) => ({
      key,
      status: key === 'hero' || key === 'intro' || key === 'trips' || key === 'related' ? 'candidate-source-available' : 'needs-agent-assessment',
      sourceHints: sourceHintsForSection(key, options),
    })),
    quality,
  }
}

function sourceHintsForSection(key, options = { includeRelatedEvents: false }) {
  if (!options.includeRelatedEvents) {
    const hints = {
      hero: ['identity', 'seo', 'facts.coordinates', 'media.mainImage'],
      intro: ['legacyContent.bodyHtml'],
      history: ['legacyContent.bodyHtml'],
      rock: ['legacyContent.bodyHtml'],
      who: ['legacyContent.bodyHtml'],
      grades: ['legacyContent.bodyHtml'],
      season: ['legacyContent.bodyHtml'],
      gear: ['legacyContent.bodyHtml'],
      transport: ['legacyContent.bodyHtml'],
      stay: ['legacyContent.bodyHtml'],
      restdays: ['legacyContent.bodyHtml'],
      tips: ['legacyContent.bodyHtml'],
      safety: ['legacyContent.bodyHtml'],
      costs: ['legacyContent.bodyHtml'],
      faq: ['legacyContent.bodyHtml'],
      trips: [],
      related: ['identity.country'],
    }
    return hints[key] ?? []
  }

  const hints = {
    hero: ['identity', 'seo', 'facts.coordinates', 'media.mainImage'],
    intro: ['legacyContent.bodyHtml', 'related.events[].perexHtml'],
    history: ['legacyContent.bodyHtml', 'related.events[].bodyHtml'],
    rock: ['legacyContent.bodyHtml', 'related.events[].bodyHtml'],
    who: ['related.events[].perexHtml', 'related.events[].bodyHtml'],
    grades: ['legacyContent.bodyHtml', 'related.events[].bodyHtml'],
    season: ['related.events[].dateSummary', 'related.events[].sampleDates[].start'],
    gear: ['related.events[].whatToBringHtml', 'related.events[].sampleDates[].whatToBringHtml'],
    transport: ['related.events[].needToKnowHtml', 'related.events[].sampleDates[].needToKnowHtml'],
    stay: ['related.events[].accommodationHtml', 'related.events[].foodHtml'],
    restdays: ['legacyContent.bodyHtml', 'related.events[].bodyHtml'],
    tips: ['legacyContent.bodyHtml', 'related.events[].needToKnowHtml'],
    safety: ['related.events[].needToKnowHtml'],
    costs: ['related.events[].dateSummary.minPrice', 'related.events[].sampleDates[].priceDetail'],
    faq: ['legacyContent.bodyHtml', 'related.events[].bodyHtml'],
    trips: ['related.events'],
    related: ['identity.country', 'related.events'],
  }
  return hints[key] ?? []
}

function markdownPacket(record) {
  const events = record.related?.events ?? []
  const visibleEvents = events.filter((event) => event.display)
  const hiddenEvents = events.filter((event) => !event.display)
  const mainImage = record.media?.mainImage
  const quality = record.quality

  const lines = []
  lines.push(`# Destination Source Packet: ${record.identity.name}`)
  lines.push('')
  lines.push('## Identity')
  lines.push(`- legacy_location_id: ${record.source.legacyLocationId}`)
  lines.push(`- slug: ${record.identity.slug}`)
  lines.push(`- title: ${record.identity.name}`)
  lines.push(`- country: ${record.identity.country ?? ''}`)
  lines.push(`- country_code: ${record.identity.countryCode ?? ''}`)
  lines.push(`- coordinates_lng_lat: ${JSON.stringify(record.facts.coordinates)}`)
  lines.push(`- legacy_url: ${record.source.legacyUrl}`)
  lines.push(`- legacy_display: ${record.source.legacyDisplay}`)
  lines.push('')
  lines.push('## Quality')
  lines.push(`- has_legacy_body: ${quality.hasLegacyBody}`)
  lines.push(`- has_main_image: ${quality.hasMainImage}`)
  lines.push(`- related_events: ${quality.relatedEventCount}`)
  lines.push(`- visible_related_events: ${quality.visibleRelatedEventCount}`)
  lines.push(`- warnings: ${quality.warnings.length ? quality.warnings.join(', ') : 'none'}`)
  lines.push('')
  lines.push('## Destination Guide Blueprint')
  for (const section of record.destinationGuideBlueprint) {
    lines.push(`- ${section.key}: ${section.status}; source hints: ${section.sourceHints.join(', ') || 'none'}`)
  }
  lines.push('')
  lines.push('## SEO Fields')
  lines.push(`- description: ${record.seo.description ?? ''}`)
  lines.push(`- keywords: ${record.seo.keywords ?? ''}`)
  lines.push('')
  lines.push('## Media')
  if (mainImage) {
    lines.push(`- legacy_media_id: ${mainImage.legacyMediaId}`)
    lines.push(`- name: ${mainImage.name ?? ''}`)
    lines.push(`- provider_reference: ${mainImage.providerReference ?? ''}`)
    lines.push(`- content_type: ${mainImage.contentType ?? ''}`)
    lines.push(`- size: ${mainImage.width ?? ''}x${mainImage.height ?? ''}`)
  } else {
    lines.push('- none')
  }
  lines.push('')
  lines.push('## Legacy Location Body')
  lines.push('')
  lines.push(fence(record.legacyContent?.bodyHtml ?? ''))
  lines.push('')
  lines.push('## Legacy Location Body Text')
  lines.push('')
  lines.push(stripHtml(record.legacyContent?.bodyHtml ?? '') || '(empty)')
  lines.push('')
  lines.push('## Related Visible Events')
  lines.push('')
  if (visibleEvents.length === 0) lines.push('(none)')
  for (const event of visibleEvents) pushEvent(lines, event)
  lines.push('')
  lines.push('## Related Hidden Events')
  lines.push('')
  if (hiddenEvents.length === 0) lines.push('(none)')
  for (const event of hiddenEvents) pushEvent(lines, event)
  lines.push('')
  return `${lines.join('\n')}\n`
}

function pushEvent(lines, event) {
  lines.push(`### ${event.title} (${event.slug})`)
  lines.push(`- legacy_event_id: ${event.legacyEventId}`)
  lines.push(`- display: ${event.display}`)
  lines.push(`- page_title: ${event.pageTitle ?? ''}`)
  lines.push(`- description: ${event.description ?? ''}`)
  lines.push(`- date_summary: ${JSON.stringify(event.dateSummary ?? {})}`)
  lines.push('')

  const fields = [
    ['perexHtml', 'Perex'],
    ['bodyHtml', 'Body'],
    ['bodyMoreHtml', 'Body More'],
    ['includeTextHtml', 'Include Text'],
    ['itineraryTextHtml', 'Itinerary Text'],
    ['includedHtml', 'Included'],
    ['excludedHtml', 'Excluded'],
    ['accommodationHtml', 'Accommodation'],
    ['foodHtml', 'Food'],
    ['whatToBringHtml', 'What To Bring'],
  ]

  for (const [field, label] of fields) {
    if (hasMeaningfulText(event[field])) {
      lines.push(`#### ${label}`)
      lines.push(fence(event[field]))
      lines.push('')
    }
  }

  const needToKnow = (event.needToKnowHtml ?? []).filter(hasMeaningfulText)
  if (needToKnow.length) {
    lines.push('#### Need To Know')
    for (const item of needToKnow) {
      lines.push(fence(item))
    }
    lines.push('')
  }

  const sampleDates = event.sampleDates ?? []
  if (sampleDates.length) {
    lines.push('#### Sample Dates')
    for (const date of sampleDates) {
      lines.push(`- ${date.slug}: ${date.start} to ${date.end}, price ${date.price}, hidden=${date.hidden}, full=${date.full}`)
      if (date.priceDetail) lines.push(`  price_detail: ${date.priceDetail}`)
      if (hasMeaningfulText(date.perexHtml)) lines.push(`  perex: ${stripHtml(date.perexHtml).slice(0, 300)}`)
    }
    lines.push('')
  }
}

async function writeOutputs(records, outDir, options) {
  const packetsDir = path.join(outDir, 'input')
  const jsonDir = path.join(outDir, 'source-json')
  await fs.mkdir(packetsDir, { recursive: true })
  await fs.mkdir(jsonDir, { recursive: true })

  const enriched = records.map((record) => attachBlueprint(record, options))
  const index = enriched.map((record) => ({
    legacyLocationId: record.source.legacyLocationId,
    slug: record.identity.slug,
    name: record.identity.name,
    country: record.identity.country,
    legacyUrl: record.source.legacyUrl,
    packet: path.posix.join('input', filenameForSlug(record.identity.slug)),
    sourceJson: path.posix.join('source-json', jsonFilenameForSlug(record.identity.slug)),
    quality: record.quality,
  }))

  for (const record of enriched) {
    await fs.writeFile(
      path.join(packetsDir, filenameForSlug(record.identity.slug)),
      markdownPacket(record),
      'utf8',
    )
    await fs.writeFile(
      path.join(jsonDir, jsonFilenameForSlug(record.identity.slug)),
      `${JSON.stringify(record, null, 2)}\n`,
      'utf8',
    )
  }

  await fs.writeFile(
    path.join(outDir, 'index.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), count: index.length, destinations: index }, null, 2)}\n`,
    'utf8',
  )

  const csvHeader = [
    'legacy_location_id',
    'slug',
    'name',
    'country',
    'legacy_display',
    'has_legacy_body',
    'legacy_body_text_length',
    'has_main_image',
    'related_event_count',
    'visible_related_event_count',
    'warnings',
    'packet',
  ]
  const csvRows = enriched.map((record) => [
    record.source.legacyLocationId,
    record.identity.slug,
    record.identity.name,
    record.identity.country,
    record.source.legacyDisplay,
    record.quality.hasLegacyBody,
    textLength(record.legacyContent?.bodyHtml),
    record.quality.hasMainImage,
    record.quality.relatedEventCount,
    record.quality.visibleRelatedEventCount,
    record.quality.warnings.join(';'),
    path.posix.join('input', filenameForSlug(record.identity.slug)),
  ])
  await fs.writeFile(
    path.join(outDir, 'quality-report.csv'),
    `${csvHeader.join(',')}\n${csvRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`,
    'utf8',
  )

  await fs.writeFile(
    path.join(outDir, 'README.md'),
    `# Legacy Destination Export

Generated: ${new Date().toISOString()}

This folder contains DB-backed source packets for destination content mining.
It is not a Payload import and does not write to any database.

- Destinations exported: ${enriched.length}
- Markdown packets: \`input/*.md\`
- Raw structured source JSON: \`source-json/*.source.json\`
- Index: \`index.json\`
- Quality report: \`quality-report.csv\`

Each packet is intended as the complete input for a subagent/editor to assess
available legacy content, extract supported destination-guide facts, identify
missing pieces, and draft one destination.
`,
    'utf8',
  )

  return { outDir, count: enriched.length }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sql = buildSql(args)
  const raw = runPsql(args, sql)
  const records = JSON.parse(raw)
  const result = await writeOutputs(records, path.resolve(args.out), args)
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
