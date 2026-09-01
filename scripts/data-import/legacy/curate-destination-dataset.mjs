#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = parseArgs(process.argv.slice(2))
const inputDir = args.input ?? '.scratch/legacy-destination-work/enriched-output'
const outDir = args.out ?? '.scratch/legacy-destination-work/curated-output'
const taxonomyPath =
  args.taxonomy ?? '.scratch/legacy-destination-work/normalized-taxonomy/location-taxonomy.json'

const EXCLUDE = {
  online: 'Not a physical destination/location record; source points to course content.',
  'monobloc-reus-spain': 'Indoor bouldering gym, not an outdoor destination/location page.',
  istria: 'Duplicate/bad legacy row titled Chroatia; keep istria-1 as the canonical Istria record.',
}

await mkdir(outDir, { recursive: true })

const taxonomyBySlug = new Map()
try {
  const taxonomy = JSON.parse(await readFile(taxonomyPath, 'utf8'))
  for (const location of taxonomy.locations ?? []) {
    taxonomyBySlug.set(location.slug, location)
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const files = (await readdir(inputDir))
  .filter((file) => file.endsWith('.enriched.json'))
  .sort((a, b) => a.localeCompare(b))

const included = []
const excluded = []

for (const file of files) {
  const record = JSON.parse(await readFile(path.join(inputDir, file), 'utf8'))

  if (EXCLUDE[record.slug]) {
    excluded.push({
      slug: record.slug,
      title: record.title,
      reason: EXCLUDE[record.slug],
      sourceFile: path.join(inputDir, file),
    })
    continue
  }

  const curated = curateRecord(record, taxonomyBySlug.get(record.slug))
  included.push({
    slug: curated.slug,
    title: curated.title,
    status: curated.status,
    sourceFile: path.join(outDir, `${curated.slug}.curated.json`),
  })
  await writeFile(
    path.join(outDir, `${curated.slug}.curated.json`),
    `${JSON.stringify(curated, null, 2)}\n`,
  )
}

await writeFile(
  path.join(outDir, 'index.json'),
  `${JSON.stringify({ included, excluded }, null, 2)}\n`,
)
await writeFile(path.join(outDir, 'README.md'), toMarkdown(included, excluded))

console.log(
  JSON.stringify(
    {
      inputDir,
      outDir,
      included: included.length,
      excluded: excluded.length,
      excludedSlugs: excluded.map((record) => record.slug),
    },
    null,
    2,
  ),
)

function curateRecord(record, taxonomyRecord) {
  const base = structuredClone(record)
  if (taxonomyRecord?.destinationScope && !base.facts.destinationScope) {
    base.facts.destinationScope = taxonomyRecord.destinationScope
  }

  if (record.slug !== 'kyparissi') return base

  const curated = base
  curated.sources = curated.sources.map((source) => {
    if (source.id !== 'legacy') return source
    return {
      ...source,
      title: 'Legacy Rockbusters destination packet',
      notes: `${source.notes} Original legacy title was placeholder text and is intentionally not used.`,
    }
  })

  for (const section of curated.sections) {
    if (section.key === 'hero' && section.body === 'test, Greece') {
      section.status = 'missing'
      section.body = null
      section.sourceRefs = []
      section.warnings = [
        'Legacy hero content was placeholder text and was removed from the curated dataset.',
      ]
    }
    if (section.body) {
      section.body = section.body
        .replace('the legacy title “test” was not preserved as the public title.', 'the bad legacy title was not preserved as the public title.')
        .replace('the legacy title "test" was not preserved as the public title.', 'the bad legacy title was not preserved as the public title.')
    }
  }

  curated.claims = curated.claims.filter((claim) => claim.text !== 'test, Greece')
  for (const claim of curated.claims) {
    claim.text = claim.text
      .replace('the legacy title “test” was not preserved as the public title.', 'the bad legacy title was not preserved as the public title.')
      .replace('the legacy title "test" was not preserved as the public title.', 'the bad legacy title was not preserved as the public title.')
  }
  curated.qa.notes = [
    ...(curated.qa?.notes ?? []).filter((note) => !/placeholder title/i.test(note)),
    'Curated pass removed placeholder legacy title/body content.',
  ]
  curated.qa.unsourcedClaimsRemoved = [
    ...(curated.qa?.unsourcedClaimsRemoved ?? [])
      .filter((claim) => !/placeholder|test/i.test(claim)),
  ]
  return curated
}

function toMarkdown(included, excluded) {
  const lines = [
    '# Curated Destination Dataset',
    '',
    `Included records: ${included.length}`,
    `Excluded records: ${excluded.length}`,
    '',
    '## Excluded',
    '',
  ]
  for (const record of excluded) {
    lines.push(`- ${record.slug}: ${record.title} — ${record.reason}`)
  }
  lines.push('', '## Included', '')
  for (const record of included) {
    lines.push(`- ${record.slug}: ${record.title} (${record.status})`)
  }
  return `${lines.join('\n')}\n`
}

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--input') parsed.input = argv[++index]
    else if (arg === '--out') parsed.out = argv[++index]
    else if (arg === '--taxonomy') parsed.taxonomy = argv[++index]
    else if (arg === '--help') {
      console.log('Usage: node scripts/data-import/legacy/curate-destination-dataset.mjs [--input DIR] [--out DIR] [--taxonomy FILE]')
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return parsed
}
