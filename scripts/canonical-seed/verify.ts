/** Compare exported catalogue content, preserving array order and every authored field. */
import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { remapRelationships, type SeedIDMap } from '../seed'
import type { CollectionSlug } from 'payload'
import { readCanonicalSeed, type CanonicalSeed } from './shared'

export function comparable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(comparable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, comparable(entry)]),
    )
  }
  return value
}

function verifyOccurrenceLinks(
  source: unknown,
  target: unknown,
  ids: Map<string, string | number> | undefined,
): number {
  if (!source || typeof source !== 'object') return 0
  let checked = 0
  for (const [key, value] of Object.entries(source)) {
    const actual =
      target && typeof target === 'object' ? (target as Record<string, unknown>)[key] : undefined
    if (key === 'href' && typeof value === 'string' && /^\/trips\//.test(value)) {
      const expectedID = new URL(value, 'https://seed.invalid').searchParams.get('date')
      if (expectedID) {
        const mapped = ids?.get(expectedID)
        if (
          mapped === undefined ||
          typeof actual !== 'string' ||
          new URL(actual, 'https://seed.invalid').searchParams.get('date') !== String(mapped)
        ) {
          throw new Error('Occurrence link mismatch: event-dates')
        }
        checked += 1
      }
    } else checked += verifyOccurrenceLinks(value, actual, ids)
  }
  return checked
}

export function verifySnapshots(source: CanonicalSeed, target: CanonicalSeed, maps: SeedIDMap) {
  let rows = 0
  let enrichedOccurrences = 0
  for (const collection of source.collections) {
    const actual = target.collections.find((entry) => entry.slug === collection.slug)?.rows
    if (!actual || actual.length !== collection.rows.length) {
      throw new Error(`Collection count mismatch: ${collection.slug}`)
    }
    const seen = new Set<string>()
    for (const row of collection.rows) {
      const mappedID = maps.get(collection.slug)?.get(String(row.id))
      if (mappedID === undefined || seen.has(String(mappedID)))
        throw new Error(`Invalid record mapping: ${collection.slug}`)
      seen.add(String(mappedID))
      const imported = actual.find((entry) => String(entry.id) === String(mappedID))
      if (!imported) throw new Error(`Missing mapped record: ${collection.slug}`)
      verifyOccurrenceLinks(row, imported, maps.get('event-dates'))
      const expected = remapRelationships(maps, collection.slug, row)
      if (JSON.stringify(comparable(expected)) !== JSON.stringify(comparable(imported))) {
        throw new Error(`Content mismatch: ${collection.slug}`)
      }
      rows += 1
      if (
        collection.slug === 'event-dates' &&
        row.editorial &&
        JSON.stringify(row.editorial).includes('"text"')
      ) {
        enrichedOccurrences += 1
      }
    }
  }
  return { collections: source.collections.length, rows, enrichedOccurrences }
}

async function main() {
  const [sourceFile, targetFile, receiptFile] = process.argv.slice(2)
  if (!sourceFile || !targetFile || !receiptFile) throw new Error('Missing verification files')
  const receipt = JSON.parse(await fs.readFile(receiptFile, 'utf8'))
  const maps: SeedIDMap = new Map(
    Object.entries(receipt).map(([slug, entries]) => [
      slug as CollectionSlug,
      new Map(Object.entries(entries as Record<string, string | number>)),
    ]),
  )
  const result = verifySnapshots(
    await readCanonicalSeed(sourceFile),
    await readCanonicalSeed(targetFile),
    maps,
  )
  console.log(JSON.stringify({ verificationPassed: true, ...result }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    // Only our closed set of diagnostic categories; never forward library errors.
    const message =
      error instanceof Error &&
      /^(Collection count mismatch|Missing mapped record|Content mismatch|Invalid record mapping|Occurrence link mismatch): [a-z-]+$/.test(
        error.message,
      )
        ? error.message
        : 'Canonical seed verification failed'
    console.error(message)
    process.exitCode = 1
  })
}
