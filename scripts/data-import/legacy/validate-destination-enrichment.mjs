#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises'
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

const PUBLIC_BODY_REJECT_PATTERNS = [
  /\bmigration\b/i,
  /\bCMS seed\b/i,
  /\bthis pass\b/i,
  /\bsource-backed\b/i,
  /\bsource-gated\b/i,
  /\bsource management\b/i,
  /\bdesigner template\b/i,
  /\bproduction team\b/i,
  /\bhuman-reviewed\b/i,
  /\beditorial (message|approach|decision|review|copy)\b/i,
  /\bpublic copy\b/i,
  /\bpublish(?:ing|ed)?\b/i,
  /\bthe page should\b/i,
  /\bthe content should\b/i,
  /\bshould be treated as\b/i,
  /\bkeep the (statement|copy|content) conservative\b/i,
  /\bdo not invent\b/i,
  /\bdo not publish\b/i,
  /\bcurrent (guidebook|source|local .*?) should be (checked|verified)\b/i,
  /\bcurrent source (coverage|detail|count|material)\b/i,
  /\bsourced (picture|detail|count|material|section|source)\b/i,
  /\bguidebook source\b/i,
  /\broutebook source\b/i,
  /\bcompanion source\b/i,
  /\bsource material\b/i,
  /\bsource coverage\b/i,
  /\bunless (the )?(production team|we|you) verifies?\b/i,
  /\bthe safest (page )?copy is\b/i,
  /\bthe most useful editorial message is\b/i,
  /\bneeds? (human|editorial|manual) review\b/i,
  /\bstale migration file\b/i,
  /\blegacy (Rockbusters|source|text|copy|description|body|database)\b/i,
  /\bold Rockbusters\b/i,
  /\bcurrent Rockbusters\b/i,
  /\bnewer Rockbusters\b/i,
  /\bthe old (site|text|copy|description|Rockbusters)\b/i,
  /\bthe older (site|text|copy|description|Rockbusters)\b/i,
  /\bthe source (says|mentions|describes|gives)\b/i,
  /\bsource packet\b/i,
  /\bsource set\b/i,
  /\bcurrent batch\b/i,
  /\bv3 file\b/i,
  /\bcurated dataset\b/i,
  /\bretained tags\b/i,
  /\bretained material\b/i,
  /\bretained (scale|guide|source|file|count|routebook|taxonomy|airport|nearest-airport|grade|grade range|rock type|accommodation|theCrag|UKClimbing)\b/i,
  /\bofficial listing\b/i,
  /\bcurrent listing\b/i,
  /\bthe current listing\b/i,
  /\bthe file retains\b/i,
  /\bprepared data\b/i,
  /\bimporter\b/i,
  /\btaxonomy\b/i,
  /\bthe guidebook listing\b/i,
  /\b27 Crags (says|describes|highlights|points to|adds)\b/i,
  /\bValencia Climb (says|describes|confirms|adds|lists|notes)\b/i,
  /\baccording to (27 Crags|Valencia Climb|the source|the guidebook)\b/i,
]

const GENERIC_TRAVEL_COPY_PATTERNS = [
  /\bhidden gem\b/i,
  /\bcaptivating island\b/i,
  /\bvertical playground\b/i,
  /\bsacred .* sanctuary\b/i,
  /\bultimate (rockbusters )?guide\b/i,
  /\blook no further\b/i,
  /\btake your .* to new heights\b/i,
  /\bparadise for (climbers|rock climbing enthusiasts)\b/i,
]

const inputStat = await statSafe(inputDir)
const files = inputStat?.isFile()
  ? [path.basename(inputDir)]
  : (
      await readdirSafe(inputDir)
    )
      .filter((file) => file.endsWith('.json') && !file.endsWith('index.json'))
      .sort((a, b) => a.localeCompare(b))

const results = []
for (const file of files) {
  const issues = []
  let data
  try {
    const filePath = inputStat?.isFile() ? inputDir : path.join(inputDir, file)
    data = JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    results.push({ file, ok: false, issues: [`Invalid JSON: ${error.message}`] })
    continue
  }

  if (!data.slug) issues.push('Missing slug')
  const validNames = [
    `${data.slug}.enriched.json`,
    `${data.slug}.curated.json`,
    `${data.slug}.curated-v2.json`,
    `${data.slug}.curated-v3.json`,
  ]
  if (!validNames.includes(file)) {
    issues.push(
      `Filename does not match slug: expected ${validNames.join(' or ')}`,
    )
  }
  if (!Array.isArray(data.sources) || data.sources.length === 0) {
    issues.push('Missing top-level sources')
  } else {
    data.sources.forEach((source, index) => validateSource(source, `sources[${index}]`, issues))
  }

  validateControlledFields(data, issues)
  validateSections(data, issues)
  validatePublicBodyQuality(data, issues)
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

async function statSafe(filePath) {
  try {
    return await stat(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function readdirSafe(dirPath) {
  try {
    return await readdir(dirPath)
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

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

function validatePublicBodyQuality(data, issues) {
  for (const section of data.sections ?? []) {
    if (!section.body || typeof section.body !== 'string') continue
    for (const pattern of PUBLIC_BODY_REJECT_PATTERNS) {
      if (pattern.test(section.body)) {
        issues.push(`${section.key} body contains internal/process language: ${pattern}`)
      }
    }
    for (const pattern of GENERIC_TRAVEL_COPY_PATTERNS) {
      if (pattern.test(section.body)) {
        issues.push(`${section.key} body contains generic generated travel copy: ${pattern}`)
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
