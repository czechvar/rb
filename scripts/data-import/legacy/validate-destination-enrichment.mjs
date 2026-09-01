#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const args = parseArgs(process.argv.slice(2))
const inputDir = args.input ?? '.scratch/legacy-destination-work/enriched-output'

const SECTION_KEYS = [
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

const ENUMS = {
  locationKind: [
    'sport-climbing-area',
    'bouldering-area',
    'multi-pitch-area',
    'mixed-climbing-area',
    'alpine-climbing-area',
    'online',
  ],
  destinationScope: ['crag', 'area', 'region', 'country', 'indoor', 'unknown'],
  climbingStyles: ['sport', 'bouldering', 'multi-pitch', 'trad', 'deep-water-soloing'],
  rockTypes: ['limestone', 'sandstone', 'granite', 'conglomerate', 'gneiss', 'dolomite'],
  rockFeatures: ['tufas', 'caves', 'overhangs', 'slabs', 'pockets', 'crimps', 'cracks', 'roofs'],
  settingTags: ['coastal', 'island', 'gorge-canyon', 'forest', 'mountain', 'valley'],
  bestSeasons: ['spring', 'summer', 'autumn', 'winter', 'year-round'],
  avoidSeasons: ['spring', 'summer', 'autumn', 'winter'],
  accommodationTags: [
    'campsite',
    'hotel',
    'guesthouse-b-and-b',
    'apartment',
    'hostel',
    'refuge-hut',
    'villa',
    'rural-cottage',
    'luxury',
  ],
  transportTags: [
    'car-recommended',
    'public-transport-possible',
    'flight-access',
    'ferry-access',
    'walkable-local-access',
  ],
}

let dirEntries = []
try {
  dirEntries = await readdir(inputDir)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const files = dirEntries
  .filter((file) => file.endsWith('.enriched.json') || file.endsWith('.curated.json'))
  .sort((a, b) => a.localeCompare(b))

const results = []
for (const file of files) {
  const issues = []
  let data
  try {
    data = JSON.parse(await readFile(path.join(inputDir, file), 'utf8'))
  } catch (error) {
    results.push({ file, ok: false, issues: [`Invalid JSON: ${error.message}`] })
    continue
  }

  if (!data.slug) issues.push('Missing slug')
  if (file !== `${data.slug}.enriched.json` && file !== `${data.slug}.curated.json`) {
    issues.push(`Filename does not match slug: expected ${data.slug}.enriched.json or ${data.slug}.curated.json`)
  }
  if (!Array.isArray(data.sources) || data.sources.length === 0) {
    issues.push('Missing top-level sources')
  } else {
    data.sources.forEach((source, index) => validateSource(source, `sources[${index}]`, issues))
  }

  validateControlledFields(data, issues)
  validateSections(data, issues)
  validateClaimsHaveSources(data, issues)

  results.push({ file, ok: issues.length === 0, issues })
}

const summary = {
  checked: results.length,
  ok: results.filter((result) => result.ok).length,
  failed: results.filter((result) => !result.ok).length,
  results,
}

console.log(JSON.stringify(summary, null, 2))
if (summary.failed > 0) process.exitCode = 1

function validateSource(source, label, issues) {
  if (!source || typeof source !== 'object') {
    issues.push(`${label} is not an object`)
    return
  }
  if (!source.url || typeof source.url !== 'string') issues.push(`${label} missing url`)
  if (!/^https?:\/\//.test(source.url ?? '')) issues.push(`${label} url must be http(s)`)
  if (!source.title || typeof source.title !== 'string') issues.push(`${label} missing title`)
  if (!source.publisher || typeof source.publisher !== 'string') issues.push(`${label} missing publisher`)
  if (!source.accessedAt || typeof source.accessedAt !== 'string') issues.push(`${label} missing accessedAt`)
}

function validateControlledFields(data, issues) {
  const facts = data.facts ?? {}
  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (field === 'locationKind' || field === 'destinationScope') {
      if (facts[field] != null && !allowed.includes(facts[field])) {
        issues.push(`Invalid ${field}: ${facts[field]}`)
      }
      continue
    }
    const values = facts[field] ?? []
    if (!Array.isArray(values)) {
      issues.push(`${field} must be an array`)
      continue
    }
    for (const value of values) {
      if (!allowed.includes(value)) issues.push(`Invalid ${field} value: ${value}`)
    }
  }
}

function validateSections(data, issues) {
  if (!Array.isArray(data.sections)) {
    issues.push('Missing sections array')
    return
  }
  const keys = data.sections.map((section) => section.key)
  for (const key of SECTION_KEYS) {
    if (!keys.includes(key)) issues.push(`Missing section: ${key}`)
  }
  for (const section of data.sections) {
    if (!SECTION_KEYS.includes(section.key)) issues.push(`Unknown section: ${section.key}`)
    if (!['legacy', 'enriched', 'mixed', 'missing', 'not-applicable'].includes(section.status)) {
      issues.push(`Invalid status for ${section.key}: ${section.status}`)
    }
    if (section.status !== 'missing' && section.status !== 'not-applicable') {
      if (!section.body || typeof section.body !== 'string') {
        issues.push(`${section.key} has content status but no body`)
      }
      if (!Array.isArray(section.sourceRefs) || section.sourceRefs.length === 0) {
        issues.push(`${section.key} has content but no sourceRefs`)
      }
    }
  }
}

function validateClaimsHaveSources(data, issues) {
  for (const claim of data.claims ?? []) {
    if (!claim.text) issues.push('Claim missing text')
    if (!Array.isArray(claim.sourceRefs) || claim.sourceRefs.length === 0) {
      issues.push(`Claim missing sourceRefs: ${claim.text ?? '(no text)'}`)
    }
  }
}

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--input') parsed.input = argv[++index]
    else if (arg === '--help') {
      console.log('Usage: node scripts/data-import/legacy/validate-destination-enrichment.mjs [--input DIR]')
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return parsed
}
