/** Keep generated editorial sources from reintroducing numeric public trip selectors. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const base = path.dirname(fileURLToPath(import.meta.url))
const seed = JSON.parse(await fs.readFile(path.join(base, '../seed/canonical-payload-seed.json'), 'utf8'))
const eventSlugs = new Map(
  seed.collections.find((entry) => entry.slug === 'events').rows.map((row) => [String(row.id), row.slug]),
)
const identities = new Map(
  seed.collections.find((entry) => entry.slug === 'event-dates').rows.map((row) => [String(row.id), {
    eventSlug: eventSlugs.get(String(row.event)),
    occurrenceSlug: row.slug,
  }]),
)
const files = ['manifests/espana.json', 'manifests/standalone.json', 'references/standalone.json']
let changed = 0
let currentFile = ''

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, child]) => {
    if (key !== 'href' || typeof child !== 'string') return [key, canonicalize(child)]
    const match = child.match(/^\/trips\/([^/?#]+)\?date=(\d+)(#.*)?$/)
    if (!match) return [key, child]
    const identity = identities.get(match[2])
    if (!identity?.occurrenceSlug || identity.eventSlug !== match[1]) {
      throw new Error(`Unresolved canonical occurrence identity in ${path.basename(currentFile)}`)
    }
    changed += 1
    return [key, `/trips/${identity.eventSlug}/${identity.occurrenceSlug}${match[3] ?? ''}`]
  }))
}

for (const relative of files) {
  currentFile = path.join(base, relative)
  const original = JSON.parse(await fs.readFile(currentFile, 'utf8'))
  const result = canonicalize(original)
  if (process.argv.includes('--write')) await fs.writeFile(currentFile, `${JSON.stringify(result, null, 2)}\n`)
}
console.log(JSON.stringify({ mode: process.argv.includes('--write') ? 'write' : 'check', files: files.length, changed }))
if (!process.argv.includes('--write') && changed) process.exitCode = 1
