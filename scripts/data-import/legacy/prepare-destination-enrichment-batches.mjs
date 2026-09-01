#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = parseArgs(process.argv.slice(2))
const taxonomyPath =
  args.taxonomy ?? '.scratch/legacy-destination-work/normalized-taxonomy/location-taxonomy.json'
const outDir = args.out ?? '.scratch/legacy-destination-work/enrichment-batches'
const batchCount = Number(args.batches ?? 2)

if (!Number.isInteger(batchCount) || batchCount < 1) {
  throw new Error('--batches must be a positive integer')
}

const taxonomy = JSON.parse(await readFile(taxonomyPath, 'utf8'))
const locations = [...taxonomy.locations].sort((a, b) => {
  const aScore = priorityScore(a)
  const bScore = priorityScore(b)
  return bScore - aScore || a.slug.localeCompare(b.slug)
})

const batches = Array.from({ length: batchCount }, () => [])
locations.forEach((location, index) => {
  batches[index % batchCount].push(location)
})

await mkdir(outDir, { recursive: true })

for (const [index, batch] of batches.entries()) {
  const id = String(index).padStart(2, '0')
  await writeFile(
    path.join(outDir, `batch-${id}.json`),
    `${JSON.stringify({ batch: id, count: batch.length, locations: batch }, null, 2)}\n`,
  )
}

await writeFile(
  path.join(outDir, 'README.md'),
  toMarkdown(batches),
)

console.log(
  JSON.stringify(
    {
      source: taxonomyPath,
      outDir,
      batches: batches.map((batch, index) => ({
        batch: String(index).padStart(2, '0'),
        count: batch.length,
        slugs: batch.map((location) => location.slug),
      })),
    },
    null,
    2,
  ),
)

function priorityScore(location) {
  const quality = location.quality ?? {}
  const confidence = { high: 0, medium: 5, low: 10 }[quality.overallConfidence] ?? 5
  const coverage = { strong: 0, partial: 5, thin: 10 }[quality.sourceCoverage] ?? 5
  const missing = [
    !location.locationKind,
    location.climbingStyles.length === 0,
    location.rockTypes.length === 0,
    location.bestSeasons.length === 0,
    location.settingTags.length === 0,
    location.transportTags.length === 0,
  ].filter(Boolean).length
  return confidence + coverage + missing * 3
}

function toMarkdown(batches) {
  const lines = [
    '# Destination Enrichment Batches',
    '',
    'Generated from normalized taxonomy output.',
    '',
  ]

  for (const [index, batch] of batches.entries()) {
    lines.push(`## Batch ${String(index).padStart(2, '0')}`, '')
    for (const location of batch) {
      const quality = location.quality ?? {}
      lines.push(
        `- ${location.slug}: ${location.title} (${quality.overallConfidence ?? 'unknown'} confidence, ${quality.sourceCoverage ?? 'unknown'} coverage)`,
      )
    }
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--taxonomy') parsed.taxonomy = argv[++index]
    else if (arg === '--out') parsed.out = argv[++index]
    else if (arg === '--batches') parsed.batches = argv[++index]
    else if (arg === '--help') {
      console.log('Usage: node scripts/data-import/legacy/prepare-destination-enrichment-batches.mjs [--taxonomy FILE] [--out DIR] [--batches 2]')
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return parsed
}
