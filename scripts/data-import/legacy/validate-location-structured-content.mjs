#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const REQUIRED_SECTION_KEYS = ['intro', 'history', 'rock', 'grades', 'gear', 'restdays', 'safety', 'costs']
const PUBLIC_COPY_REJECT_PATTERNS = [
  /\bmigration\b/i,
  /\bCMS\b/i,
  /\bsource-backed\b/i,
  /\bsource-gated\b/i,
  /\bdesigner template\b/i,
  /\bproduction team\b/i,
  /\bhuman-reviewed\b/i,
  /\bpublic copy\b/i,
  /\bthe page should\b/i,
  /\bthe content should\b/i,
  /\blegacy Rockbusters\b/i,
  /\bold Rockbusters\b/i,
  /\bcurrent Rockbusters\b/i,
  /\bsource (says|mentions|describes|gives)\b/i,
  /\baccording to\b/i,
  /\bverify before publishing\b/i,
]

const args = parseArgs(process.argv.slice(2))
const input = path.resolve(args.input ?? '.scratch/location-structured-extraction/output')
const strict = Boolean(args.strict)
const checkFilenames = Boolean(args.checkFilenames)
const files = await inputFiles(input)
if (!files.length) {
  throw new Error(`No JSON files found at ${relative(input)}`)
}

const results = []
for (const file of files) {
  const issues = []
  let data
  try {
    data = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    results.push({ file: relative(file), ok: false, issues: [`Invalid JSON: ${error.message}`] })
    continue
  }

  validateDocument(data, issues, { strict, file, checkFilenames })
  results.push({ file: relative(file), slug: data?.slug ?? null, ok: issues.length === 0, issues })
}

const summary = {
  checked: results.length,
  ok: results.filter((result) => result.ok).length,
  failed: results.filter((result) => !result.ok).length,
  results,
}

console.log(JSON.stringify(summary, null, 2))
if (summary.failed > 0) process.exitCode = 1

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--') continue
    else if (arg === '--input') parsed.input = argv[++index]
    else if (arg === '--strict') parsed.strict = true
    else if (arg === '--check-filenames') parsed.checkFilenames = true
    else if (arg === '--help') {
      console.log(
        [
          'Usage: node scripts/data-import/legacy/validate-location-structured-content.mjs --input FILE_OR_DIR [--strict] [--check-filenames]',
          '',
          'Strict mode requires all renderer-critical sections and 12 scored months.',
        ].join('\n'),
      )
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return parsed
}

async function inputFiles(fileOrDir) {
  const inputStat = await stat(fileOrDir)
  if (inputStat.isFile()) return [fileOrDir]

  const entries = await readdir(fileOrDir)
  return entries
    .filter((entry) => entry.endsWith('.json') && !entry.endsWith('index.json') && entry !== 'manifest.json')
    .sort((a, b) => a.localeCompare(b))
    .map((entry) => path.join(fileOrDir, entry))
}

function validateDocument(data, issues, options) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    issues.push('Top-level value must be an object')
    return
  }

  requiredText(data.slug, 'slug', issues)
  if (options.checkFilenames && options.file) {
    const expected = `${data.slug}.json`
    const actual = path.basename(options.file)
    if (data.slug && actual !== expected) issues.push(`Filename does not match slug: expected ${expected}`)
  }

  validateHero(data.hero, issues)
  validateSections(data.sections, issues, options.strict)
  validateHeroStats(data.hero?.heroStats, issues)
  validateCards(data.audience, 'audience', ['label'], issues)
  validateCards(data.sectors, 'sectors', ['name'], issues)
  validateSeasonMonths(data.seasonMonths, issues, options.strict)
  validateCards(data.gearGroups, 'gearGroups', ['heading'], issues)
  validateStringArrays(data.gearGroups, 'gearGroups', 'items', issues)
  validateCards(data.transportOptions, 'transportOptions', ['label'], issues)
  validateCards(data.accommodationOptions, 'accommodationOptions', ['name'], issues)
  validateCards(data.restDayIdeas, 'restDayIdeas', ['title'], issues)
  validateCards(data.accessRules, 'accessRules', ['title'], issues)
  validateCards(data.safetyItems, 'safetyItems', ['label'], issues)
  validateCards(data.costItems, 'costItems', ['label'], issues)
  validateFaqs(data.destinationFaqs, issues)
  validateCards(data.tripPromos, 'tripPromos', ['title'], issues)
  validateCards(data.relatedDestinations, 'relatedDestinations', ['name'], issues)
  validateCta(data.cta, issues)
  validatePublicCopy(data, issues)
}

function validateHero(hero, issues) {
  if (!hero || typeof hero !== 'object') {
    issues.push('hero must be an object')
    return
  }
  requiredText(hero.heading, 'hero.heading', issues)
}

function validateHeroStats(stats, issues) {
  validateCards(stats, 'hero.heroStats', ['value', 'label'], issues)
}

function validateSections(sections, issues, strict) {
  if (!Array.isArray(sections)) {
    issues.push('sections must be an array')
    return
  }

  const seen = new Set()
  for (const [index, section] of sections.entries()) {
    const label = `sections[${index}]`
    requiredText(section?.key, `${label}.key`, issues)
    requiredText(section?.heading, `${label}.heading`, issues)
    if (section?.key) {
      if (seen.has(section.key)) issues.push(`Duplicate section key: ${section.key}`)
      seen.add(section.key)
    }
  }

  if (strict) {
    for (const key of REQUIRED_SECTION_KEYS) {
      if (!seen.has(key)) issues.push(`Missing renderer-critical section: ${key}`)
    }
  }
}

function validateSeasonMonths(months, issues, strict) {
  if (!Array.isArray(months)) {
    issues.push('seasonMonths must be an array')
    return
  }
  if (strict && months.length !== 12) issues.push(`seasonMonths must contain 12 entries, found ${months.length}`)

  const seen = new Set()
  for (const [index, month] of months.entries()) {
    const label = `seasonMonths[${index}]`
    numberInRange(month?.month, `${label}.month`, 1, 12, issues)
    requiredText(month?.label, `${label}.label`, issues)
    numberInRange(month?.score, `${label}.score`, 0, 5, issues)
    if (typeof month?.month === 'number') {
      if (seen.has(month.month)) issues.push(`Duplicate season month: ${month.month}`)
      seen.add(month.month)
    }
  }
  if (strict) {
    for (let month = 1; month <= 12; month += 1) {
      if (!seen.has(month)) issues.push(`Missing season month: ${month}`)
    }
  }
}

function validateCards(value, field, requiredFields, issues) {
  if (value === undefined || value === null) return
  if (!Array.isArray(value)) {
    issues.push(`${field} must be an array`)
    return
  }
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      issues.push(`${field}[${index}] must be an object`)
      continue
    }
    for (const requiredField of requiredFields) {
      requiredText(item[requiredField], `${field}[${index}].${requiredField}`, issues)
    }
    if (item.needsVerification !== undefined && typeof item.needsVerification !== 'boolean') {
      issues.push(`${field}[${index}].needsVerification must be boolean when present`)
    }
  }
}

function validateStringArrays(items, field, nestedField, issues) {
  if (!Array.isArray(items)) return
  for (const [index, item] of items.entries()) {
    if (item?.[nestedField] === undefined || item[nestedField] === null) continue
    if (!Array.isArray(item[nestedField]) || item[nestedField].some((entry) => typeof entry !== 'string')) {
      issues.push(`${field}[${index}].${nestedField} must be an array of strings`)
    }
  }
}

function validateFaqs(faqs, issues) {
  validateCards(faqs, 'destinationFaqs', ['question', 'answer'], issues)
}

function validateCta(cta, issues) {
  if (cta === undefined || cta === null) return
  if (typeof cta !== 'object' || Array.isArray(cta)) {
    issues.push('cta must be an object')
    return
  }
  if (cta.primaryAction !== undefined) validateAction(cta.primaryAction, 'cta.primaryAction', issues)
  if (cta.secondaryAction !== undefined) validateAction(cta.secondaryAction, 'cta.secondaryAction', issues)
}

function validateAction(action, label, issues) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) {
    issues.push(`${label} must be an object`)
    return
  }
  if (action.label && !action.href) issues.push(`${label}.href is required when label is present`)
  if (action.href && !action.label) issues.push(`${label}.label is required when href is present`)
}

function validatePublicCopy(data, issues) {
  const fields = []
  collectTextFields(data.hero, 'hero', ['body'], fields)
  collectSectionBodies(data.sections, fields)
  for (const field of [
    'audience',
    'sectors',
    'transportOptions',
    'accommodationOptions',
    'restDayIdeas',
    'accessRules',
    'safetyItems',
    'destinationFaqs',
    'tripPromos',
    'relatedDestinations',
  ]) {
    collectArrayBodies(data[field], field, fields)
  }
  collectTextFields(data.cta, 'cta', ['body'], fields)

  for (const entry of fields) {
    for (const pattern of PUBLIC_COPY_REJECT_PATTERNS) {
      if (pattern.test(entry.value)) {
        issues.push(`${entry.label} contains source/process language: ${pattern}`)
      }
    }
  }
}

function collectSectionBodies(sections, fields) {
  if (!Array.isArray(sections)) return
  sections.forEach((section, index) => {
    collectTextFields(section, `sections[${index}]`, ['body'], fields)
  })
}

function collectArrayBodies(items, field, fields) {
  if (!Array.isArray(items)) return
  items.forEach((item, index) => {
    collectTextFields(item, `${field}[${index}]`, ['body', 'answer', 'summary'], fields)
  })
}

function collectTextFields(item, label, keys, fields) {
  if (!item || typeof item !== 'object') return
  for (const key of keys) {
    if (typeof item[key] === 'string' && item[key].trim()) {
      fields.push({ label: `${label}.${key}`, value: item[key] })
    }
  }
}

function requiredText(value, label, issues) {
  if (typeof value !== 'string' || !value.trim()) {
    issues.push(`Missing required text: ${label}`)
  }
}

function numberInRange(value, label, min, max, issues) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push(`Missing required number: ${label}`)
    return
  }
  if (value < min || value > max) {
    issues.push(`Number out of range ${label}: ${value}`)
  }
}

function relative(file) {
  return path.relative(process.cwd(), file) || '.'
}
